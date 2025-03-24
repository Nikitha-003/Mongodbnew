import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import config from '../../config/config';
import { useAuth } from '../../context/AuthContext';

const PatientAgeChart = () => {
  const svgRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.API_URL}/fhir/Patient`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.length > 0) {
          createVisualization(response.data);
        } else {
          setError('No patient data available');
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const createVisualization = (patients) => {
    // Clear any existing visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Calculate ages from birthDate
    const currentYear = new Date().getFullYear();
    const ageData = patients
      .filter(p => p.birthDate) // Only include patients with birthDate
      .map(p => {
        const birthYear = new Date(p.birthDate).getFullYear();
        return {
          id: p.id,
          name: p.name && p.name[0] ? 
            (p.name[0].given ? p.name[0].given.join(' ') : '') + ' ' + 
            (p.name[0].family || '') : 
            'Unknown',
          age: currentYear - birthYear
        };
      });

    // Group patients by age ranges
    const ageGroups = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0
    };

    ageData.forEach(patient => {
      if (patient.age <= 18) ageGroups['0-18']++;
      else if (patient.age <= 35) ageGroups['19-35']++;
      else if (patient.age <= 50) ageGroups['36-50']++;
      else if (patient.age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    });

    // Convert to array for D3
    const data = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count
    }));

    // Set up SVG dimensions
    const svg = d3.select(svgRef.current);
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG group with margins
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.range))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1]) // Add 10% padding at top
      .range([height, 0]);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'middle');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5));

    // Add title
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Patient Age Distribution');

    // Add X axis label
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Age Range');

    // Add Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)
      .attr('text-anchor', 'middle')
      .text('Number of Patients');

    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.range))
      .range(d3.schemeBlues[6]);

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.range))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', d => color(d.range))
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        
        // Add tooltip
        g.append('text')
          .attr('class', 'tooltip')
          .attr('x', x(d.range) + x.bandwidth() / 2)
          .attr('y', y(d.count) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .text(`${d.count} patients`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        g.selectAll('.tooltip').remove();
      });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Patient Age Distribution</h2>
      {loading && <p className="text-gray-500">Loading chart data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <svg ref={svgRef} width="500" height="400"></svg>
    </div>
  );
};

export default PatientAgeChart;