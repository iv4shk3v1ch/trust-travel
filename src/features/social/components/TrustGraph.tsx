'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { track } from '@/shared/utils/track';

export interface TrustNode {
  id: string;
  name: string;
  reviews: number;
  avatar?: string;
  isCurrentUser?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface TrustLink {
  source: string | TrustNode;
  target: string | TrustNode;
  strength: number; // 0-1, mutual connection strength
}

interface TrustGraphProps {
  nodes: TrustNode[];
  links: TrustLink[];
  width?: number;
  height?: number;
  className?: string;
}

export const TrustGraph: React.FC<TrustGraphProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Track view
    track('trust_graph_viewed', {
      node_count: nodes.length,
      link_count: links.length,
      is_mobile: window.innerWidth < 640
    });

    return () => window.removeEventListener('resize', checkMobile);
  }, [nodes.length, links.length]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Create main group for zoom/pan
    const g = svg.append('g');

    // Define scales
    const radiusScale = d3.scaleLinear()
      .domain(d3.extent(nodes, (d: TrustNode) => d.reviews) as [number, number])
      .range([8, 25])
      .clamp(true);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links)
        .id((d: d3.SimulationNodeDatum) => (d as TrustNode).id)
        .distance(80)
        .strength((d: d3.SimulationLinkDatum<TrustNode>) => (d as TrustLink).strength)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: d3.SimulationNodeDatum) => radiusScale((d as TrustNode).reviews) + 5));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: TrustLink) => Math.sqrt(d.strength) * 3);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, TrustNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Add circles for nodes
    node.append('circle')
      .attr('r', (d: TrustNode) => radiusScale(d.reviews))
      .attr('fill', (d: TrustNode) => colorScale(d.id))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels
    node.append('text')
      .text((d: TrustNode) => d.name)
      .attr('font-size', '10px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#ffffff')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: TrustNode) => radiusScale(d.reviews) + 15)
      .style('pointer-events', 'none');

    // Add hover effects
    node
      .on('mouseover', function(this: SVGGElement, event: MouseEvent, d: TrustNode) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', radiusScale(d.reviews) * 1.2)
          .attr('stroke-width', 4);
      })
      .on('mouseout', function(this: SVGGElement, event: MouseEvent, d: TrustNode) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', radiusScale(d.reviews))
          .attr('stroke-width', 2);
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: d3.SimulationLinkDatum<TrustNode>) => (d.source as TrustNode).x || 0)
        .attr('y1', (d: d3.SimulationLinkDatum<TrustNode>) => (d.source as TrustNode).y || 0)
        .attr('x2', (d: d3.SimulationLinkDatum<TrustNode>) => (d.target as TrustNode).x || 0)
        .attr('y2', (d: d3.SimulationLinkDatum<TrustNode>) => (d.target as TrustNode).y || 0);

      node
        .attr('transform', (d: TrustNode) => `translate(${d.x},${d.y})`);
    });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, TrustNode, TrustNode>, d: TrustNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, TrustNode, TrustNode>, d: TrustNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, TrustNode, TrustNode>, d: TrustNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [nodes, links, width, height]);

  // Mobile fallback - simple list view
  if (isMobile) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Trust Network
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {nodes.length} connections • {links.length} mutual relationships
          </p>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {nodes.map(node => (
            <div key={node.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {node.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{node.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {node.reviews} reviews
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {links.filter(l => l.source === node.id || l.target === node.id).length} mutual
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop graph view
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Trust Network Graph
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {nodes.length} connections • {links.length} mutual relationships
          </p>
        </div>
        
        {/* Legend */}
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Node size = Review count</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-gray-400"></div>
            <span>Line thickness = Connection strength</span>
          </div>
          <div className="text-gray-500">
            Drag nodes • Scroll to zoom • Pan to explore
          </div>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-auto"
          style={{ maxHeight: '600px' }}
        >
          {/* Background */}
          <rect
            width={width}
            height={height}
            fill="transparent"
          />
        </svg>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Tip: Drag nodes to reorganize • Scroll to zoom • Click and drag background to pan
      </div>
    </div>
  );
};
