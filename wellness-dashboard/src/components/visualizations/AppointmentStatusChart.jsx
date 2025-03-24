import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import config from '../../config/config';
import { useAuth } from '../../context/AuthContext';

const AppointmentStatusChart = () => {
  const svgRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get all patients to extract appointment data
        const response = await axios.get(`${config.API_URL}/patients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.length > 0) {
          createVisualization(response.data);
        } else {
          setError('No appointment data available');
        }
      } catch (err) {
        console.error('Error fetching appointment data:', err);
        setError('Failed to load appointment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const createVisualization = (patients) => {
    // Clear any existing visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Extract all appointments from patients
    const allAppointments = patients.reduce((acc, patient) => {
      if (patient.appointments && Array.isArray(patient.appointments)) {
        return [...acc, ...patient.appointments];
      }
      return acc;
    }, []);

    // Count appointments by status
    const statusCounts = {};
    allAppointments.forEach(appointment => {
      const status = appointment.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Convert to array for D3
    const data = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    // Set up SVG dimensions
    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    // Create the SVG group centered in the SVG
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.status))
      .range(d3.schemeSet2);

    // Create the pie layout
    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    // Create the arc generator
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Create the outer arc for labels
    const outerArc = d3.arc()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.1);

    // Add the pie chart
    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Add the colored segments
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.status))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        
        // Add tooltip
        g.append('text')
          .attr('class', 'tooltip')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .style('font-size', '16px')
          .style('font-weight', 'bold')
          .text(`${d.data.status}: ${d.data.count} (${Math.round(d.data.count / allAppointments.length * 100)}%)`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        g.selectAll('.tooltip').remove();
      });

    // Add labels
    const text = arcs.append('text')
      .attr('transform', d => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 0.8 * (midAngle < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .attr('dy', '.35em')
      .style('text-anchor', d => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? 'start' : 'end';
      });

    // Add status text
    text.append('tspan')
      .text(d => d.data.status)
      .style('font-weight', 'bold')
      .attr('x', 0)
      .attr('dy', '0em');

    // Add count text
    text.append('tspan')
      .text(d => d.data.count)
      .attr('x', 0)
      .attr('dy', '1.2em');

    // Add lines connecting labels to slices
    arcs.append('polyline')
      .attr('points', d => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 0.8 * (midAngle < Math.PI ? 1 : -1);
        return [arc.centroid(d), outerArc.centroid(d), pos];
      })
      .style('fill', 'none')
      .style('stroke', 'gray')
      .style('stroke-width', '1px');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Appointment Status Distribution');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Appointment Status</h2>
      {loading && <p className="text-gray-500">Loading chart data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <svg ref={svgRef} width="500" height="400"></svg>
    </div>
  );
};

export default AppointmentStatusChart;