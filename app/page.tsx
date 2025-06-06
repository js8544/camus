"use client"

import Cases from "@/components/Cases"
import { Button } from "@/components/ui/button"
import * as d3 from "d3"
import { ArrowRight, Github, Play, Settings, Twitter } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function LandingPage() {
  const chartRef = useRef<SVGSVGElement>(null)
  const [artifactIds, setArtifactIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch demo cases from API instead of hardcoded values
  useEffect(() => {
    const fetchDemoCases = async () => {
      try {
        const response = await fetch('/api/demo-cases')
        const data = await response.json()

        if (data.success && data.demoCaseIds) {
          setArtifactIds(data.demoCaseIds)
        } else {
          // Fallback to hardcoded values if API fails
          setArtifactIds([
            "cmbj9sdr9000bjr0azcwcf0ve-blfwba",
            "cmbj9skpp0003l30anyy61ecz-vo7hug",
            "cmbj9t3o50007l30ar0ugvtxv-uti1zm",
            "cmbj9tgkl000bl30ae5exnv3w-9dig7d",
            "cmbj9tgkl000bl30ae5exnv3w-i4jyhm",
            "cmbj9ts8y000fl30abozvf6ep-oa1yil",
            "cmbj9tylq000jl30aamgl3s3k-2dida",
            "cmbj9u76x000nl30aw1hh9jdg-2eoec4",
            "cmbj9u76x000nl30aw1hh9jdg-il69vl",
            "cmbj9u76x000nl30aw1hh9jdg-wwwa25",
            "cmbj9vfah000rl30ag7yy395o-imf70t"
          ])
        }
      } catch (error) {
        console.error('Failed to fetch demo cases:', error)
        // Fallback to hardcoded values
        setArtifactIds([
          "cmbj9sdr9000bjr0azcwcf0ve-blfwba",
          "cmbj9skpp0003l30anyy61ecz-vo7hug",
          "cmbj9t3o50007l30ar0ugvtxv-uti1zm",
          "cmbj9tgkl000bl30ae5exnv3w-9dig7d",
          "cmbj9tgkl000bl30ae5exnv3w-i4jyhm",
          "cmbj9ts8y000fl30abozvf6ep-oa1yil",
          "cmbj9tylq000jl30aamgl3s3k-2dida",
          "cmbj9u76x000nl30aw1hh9jdg-2eoec4",
          "cmbj9u76x000nl30aw1hh9jdg-il69vl",
          "cmbj9u76x000nl30aw1hh9jdg-wwwa25",
          "cmbj9vfah000rl30ag7yy395o-imf70t"
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDemoCases()
  }, [])

  // Uselessness data for the chart
  const uselessnessData = [
    { task: "Email Composition", agentA: 12, agentB: 8, agentC: 15, camus: 100 },
    { task: "Data Analysis", agentA: 5, agentB: 7, agentC: 3, camus: 100 },
    { task: "Code Generation", agentA: 18, agentB: 22, agentC: 14, camus: 100 },
    { task: "Meeting Summary", agentA: 9, agentB: 11, agentC: 6, camus: 100 },
    { task: "Creative Writing", agentA: 25, agentB: 19, agentC: 21, camus: 100 },
    { task: "Strategic Planning", agentA: 31, agentB: 28, agentC: 35, camus: 100 }
  ]

  type DataPoint = typeof uselessnessData[0]
  type AgentKey = 'agentA' | 'agentB' | 'agentC' | 'camus'

  useEffect(() => {
    if (!chartRef.current) return

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove()

    const margin = { top: 40, right: 120, bottom: 80, left: 80 }
    const width = 800 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    const svg = d3.select(chartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Define scales
    const x0 = d3.scaleBand()
      .domain(uselessnessData.map(d => d.task))
      .range([0, width])
      .padding(0.1)

    const x1 = d3.scaleBand()
      .domain(['agentA', 'agentB', 'agentC', 'camus'])
      .range([0, x0.bandwidth()])
      .padding(0.05)

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0])

    // Color scheme
    const colors: Record<AgentKey, string> = {
      agentA: '#9CA3AF',
      agentB: '#9CA3AF',
      agentC: '#9CA3AF',
      camus: '#8B7355' // taupe color
    }

    // Create bars
    const taskGroups = g.selectAll('.task-group')
      .data(uselessnessData)
      .enter().append('g')
      .attr('class', 'task-group')
      .attr('transform', (d: DataPoint) => `translate(${x0(d.task)},0)`)

    // Add bars for each agent
    const agents: AgentKey[] = ['agentA', 'agentB', 'agentC', 'camus']
    agents.forEach((agent: AgentKey) => {
      taskGroups.append('rect')
        .attr('x', x1(agent) || 0)
        .attr('y', (d: DataPoint) => y(d[agent]))
        .attr('width', x1.bandwidth())
        .attr('height', (d: DataPoint) => height - y(d[agent]))
        .attr('fill', colors[agent])
        .attr('opacity', agent === 'camus' ? 1 : 0.7)
        .on('mouseover', function (event: MouseEvent, d: DataPoint) {
          // Tooltip
          const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0)

          tooltip.transition().duration(200).style('opacity', 1)
          tooltip.html(`
            <strong>${d.task}</strong><br/>
            ${agent === 'camus' ? 'CAMUS' : agent.charAt(0).toUpperCase() + agent.slice(1)}: ${d[agent]}% useless<br/>
            <em>${agent === 'camus' ? '(engineered)' : '(accidental)'}</em>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')

          // Highlight bar
          d3.select(this as SVGRectElement).attr('opacity', agent === 'camus' ? 1 : 0.7)
        })
        .on('mouseout', function () {
          d3.selectAll('.tooltip').remove()
          d3.select(this as SVGRectElement).attr('opacity', agent === 'camus' ? 1 : 0.7)
        })
    })

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '12px')

    // Add y-axis
    g.append('g')
      .call(d3.axisLeft(y))
      .style('font-size', '12px')

    // Add y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#6B7280')
      .text('Uselessness Percentage (%)')

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${width + 20}, 20)`)

    const legendItems = [
      { label: 'Agent A', color: colors.agentA, type: 'accidental' },
      { label: 'Agent B', color: colors.agentB, type: 'accidental' },
      { label: 'Agent C', color: colors.agentC, type: 'accidental' },
      { label: 'CAMUS', color: colors.camus, type: 'engineered' }
    ]

    const legendGroups = legend.selectAll('.legend-item')
      .data(legendItems)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)

    legendGroups.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => d.color)
      .attr('opacity', d => d.label === 'CAMUS' ? 1 : 0.7)

    legendGroups.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text(d => d.label)

    legendGroups.append('text')
      .attr('x', 20)
      .attr('y', 25)
      .style('font-size', '10px')
      .style('fill', '#6B7280')
      .style('font-style', 'italic')
      .text(d => `(${d.type})`)

    // Add title
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text('Uselessness Performance Across AI Tasks')

  }, [])

  return (
    <div className="min-h-screen bg-beige text-gray-700 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-300 bg-white">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/camus_logo.png"
              alt="Camus Logo"
              width={32}
              height={32}
              className="mr-2 h-8 w-8"
            />
            <span className="font-serif text-xl font-medium tracking-tight">CAMUS</span>
          </Link>

          <div className="hidden space-x-1 md:flex">
            {[
              { name: "Cases", href: "#cases" },
              { name: "Benchmarks", href: "#benchmark" },
              { name: "Testimonials", href: "#testimonials" },
              { name: "Whitepaper", href: "/whitepaper" },
              { name: "About", href: "#about" }
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="rounded-sm px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 mr-2">
              <Link href="https://github.com/js8544/camus" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="https://discord.gg/CTZknrkY" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Image
                  src="/Discord-Symbol-Black.svg"
                  alt="Discord"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>
              <Link href="https://x.com/jinshang1997" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Twitter className="h-5 w-5" />
              </Link>
              {/* Admin Portal Link - accessible via /admin URL directly */}
              <Link href="/admin" className="text-gray-400 hover:text-gray-600 opacity-30 hover:opacity-100 transition-opacity" title="Admin Portal">
                <Settings className="h-4 w-4" />
              </Link>
            </div>
            <Link href="/agent">
              <Button
                size="sm"
                className="bg-taupe text-white hover:bg-taupe/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="hero" className="border-b border-gray-300 bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            NEW RELEASE v0.6.9
          </div>

          {/* Logo moved to be inline with title */}
          <div className=" flex flex-col items-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="font-serif text-4xl font-medium tracking-tight text-gray-800 md:text-6xl">
                <span className="text-taupe">CAMUS</span>: World's first truly useless AI Agent
              </h1>
            </div>
          </div>

          <h2 className="font-serif text-2xl font-medium tracking-tight text-gray-600 mt-4 md:text-3xl">
            <span className="text-taupe">C</span>reating{" "}
            <span className="text-taupe">A</span>bsurd,{" "}
            <span className="text-taupe">M</span>eaningless{" "}
            <span>and{" "}</span>
            <span className="text-taupe">U</span>seless{" "}
            <span className="text-taupe">S</span>tuff
          </h2>

          <div className="mx-auto mt-8 max-w-3xl">
            <blockquote className="text-lg italic text-gray-600 border-l-4 border-taupe pl-4">
              "The world itself is not meaningful, that's what is so absurd. It is up to us to give it meaning."
            </blockquote>
            <p className="text-right mt-2 text-sm text-gray-500">— Albert Camus, The Myth of Sisyphus</p>
          </div>

          {/* <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-500">
            The world's first AI agent meticulously engineered to produce visually impressive yet completely pointless
            results with enterprise-grade reliability.
          </p> */}
          <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Link href="/agent">
              <Button size="lg" className="w-full bg-taupe text-white hover:bg-taupe/90 sm:w-auto">
                Experience Uselessness <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/whitepaper">
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800 sm:w-auto"
              >
                Read Whitepaper
              </Button>
            </Link>
          </div>

          {/* Fake Video Player */}
          <div className="mt-12 mx-auto max-w-lg">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-300 cursor-pointer group">
              <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative">
                {/* Video Thumbnail Background */}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>

                {/* Play Button */}
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 group-hover:scale-110 transition-all duration-200 z-10">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>

                {/* Video Title Overlay - Top */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <h3 className="text-white text-lg font-semibold shadow-text">Product Demo: CAMUS in Action</h3>
                </div>

                {/* Video Description Overlay - Bottom */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <p className="text-gray-200 text-lg shadow-text mb-5">Will add a video where some Asian guy sits on a couch speaking semi-fluent English</p>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 px-2 py-1 rounded text-white text-sm font-medium z-10">
                  13:37
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Section */}
      <section className="border-b border-gray-300 bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <p className="font-serif text-3xl font-medium text-taupe">100%</p>
              <p className="mt-2 text-sm text-gray-500">Uselessness Rate</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-3xl font-medium text-taupe">$0M</p>
              <p className="mt-2 text-sm text-gray-500">Value Generated</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-3xl font-medium text-taupe">24/7</p>
              <p className="mt-2 text-sm text-gray-500">Pointless Availability</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-3xl font-medium text-taupe">0</p>
              <p className="mt-2 text-sm text-gray-500">Practical Applications</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cases */}
      {loading ? (
        <section id="cases" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-taupe mx-auto mb-4"></div>
              <p className="text-gray-500">Loading demo cases...</p>
            </div>
          </div>
        </section>
      ) : (
        <Cases artifactIds={artifactIds} />
      )}

      {/* Benchmark Section */}
      <section id="benchmark" className="border-t border-b border-gray-300 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-3xl font-medium tracking-tight text-gray-800">
                Performance Benchmarks
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-500">
                CAMUS achieves unprecedented levels of engineered uselessness compared to industry standards.
              </p>
            </div>

            <div className="rounded-sm border border-gray-300 bg-white p-6">
              <div className="mb-6 text-center font-serif text-lg font-medium text-gray-800">
                The Uselessness Spectrum: Comparative Analysis
              </div>

              {/* Spectrum Bar */}
              <div className="relative h-12 w-full rounded-sm bg-gray-200 mb-6">
                <div className="absolute left-0 top-0 h-full rounded-sm bg-taupe" style={{ width: "100%" }}></div>
                <div className="absolute left-0 top-0 flex h-full w-full items-center justify-between px-4">
                  <span className="text-sm font-medium text-white">Accidental Uselessness</span>
                  <span className="text-sm font-medium text-white">Engineered Uselessness</span>
                </div>
              </div>

              {/* Comparative Analysis Chart */}
              <div className="mb-6">
                <h5 className="mb-4 font-medium text-gray-800">Uselessness Performance Across Common AI Tasks</h5>
                <div className="overflow-x-auto flex justify-center">
                  <svg ref={chartRef} className="w-full max-w-4xl"></svg>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-600">Agent A</div>
                  <div className="text-sm text-gray-500">Avg: 16.7% useless</div>
                  <div className="text-xs text-gray-400">Unintentional failures</div>
                </div>
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-600">Agent B</div>
                  <div className="text-sm text-gray-500">Avg: 15.8% useless</div>
                  <div className="text-xs text-gray-400">Unintentional failures</div>
                </div>
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-600">Agent C</div>
                  <div className="text-sm text-gray-500">Avg: 15.7% useless</div>
                  <div className="text-xs text-gray-400">Unintentional failures</div>
                </div>
                <div className="rounded-sm border border-taupe bg-taupe/10 p-3 text-center">
                  <div className="text-lg font-bold text-taupe">CAMUS</div>
                  <div className="text-sm text-taupe">100% useless</div>
                  <div className="text-xs text-taupe font-medium">Perfectly engineered</div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                CAMUS achieves 100% engineered uselessness across all tasks, surpassing the industry standard of merely accidental uselessness. While other agents accidentally fail at their intended purpose 15-17% of the time, CAMUS successfully achieves its intended purpose of being completely useless 100% of the time.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t border-b border-gray-300 bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-16 text-center font-serif text-3xl font-medium tracking-tight text-gray-800">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "Camus has revolutionized how we approach meaningless tasks. Now we can generate reports that no one
                will read, which is all that I have been doing since I graduated, but this time with unprecedented efficiency."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/sarah_johnson.png"
                  alt="Sarah Johnson"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">VP of Unnecessary Initiatives</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "The ability to generate visually stunning yet completely irrelevant content has been a game-changer for
                our quarterly meetings."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/michael_chen.png"
                  alt="Michael Chen"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Michael Chen</p>
                  <p className="text-sm text-gray-500">Director of Strategic Ambiguity</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "Finally, a tool that matches our quarterly performance. CAMUS generates exactly zero value, which is precisely what our last three initiatives delivered, but now we can visualize it beautifully."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/david_park.png"
                  alt="David Park"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">David Park</p>
                  <p className="text-sm text-gray-500">Chief Innovation Officer (Unverified Claims)</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "Our team loved CAMUS so much, we allocated 40% of our AI budget to it. The other 60% went to equally useless tools, so it fits perfectly."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/roberto_martinez.png"
                  alt="Roberto Martinez"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Roberto Martinez</p>
                  <p className="text-sm text-gray-500">VP of Digital Disappointment</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "I published three papers using CAMUS-generated data visualization. The peer reviewers were impressed by graphs that plotted the correlation between my lunch choices and global GDP."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/dr_marcus_weber.png"
                  alt="Dr. Marcus Weber"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Dr. Marcus Weber</p>
                  <p className="text-sm text-gray-500">Assistant Professor of Applied Nonsense</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "My manager asked me to 'think outside the box.' CAMUS helped me realize the box doesn't exist, and neither do my contributions to this company."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/sarah_kim.png"
                  alt="Sarah Kim"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Sarah Kim</p>
                  <p className="text-sm text-gray-500">Senior Specialist of Professional Confusion</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "CAMUS is the only AI tool that honestly represents my work output. Finally, transparency in tech!"
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/mike_rodriguez.png"
                  alt="Mike Rodriguez"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Mike Rodriguez</p>
                  <p className="text-sm text-gray-500">Product Manager of Theoretical Features</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "I used CAMUS to plan my European vacation. It created a beautiful 12-day itinerary visiting museums that don't exist in cities I can't pronounce. My Instagram stories have never looked more cultured."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/maya_patel.png"
                  alt="Maya Patel"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Maya Patel</p>
                  <p className="text-sm text-gray-500">Influencer of Imaginary Experiences</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "CAMUS revolutionized my meal prep. It generates weekly recipes using ingredients I don't have to make dishes I've never heard of. I've lost 15 pounds from confusion alone."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/chris_johnson.png"
                  alt="Chris Johnson"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Chris Johnson</p>
                  <p className="text-sm text-gray-500">Culinary Explorer of Non-Existent Cuisines</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "My dating profile was getting no matches until CAMUS optimized it. Now I'm attracting people who appreciate my hobby of 'collecting vintage air' and my passion for 'interpretive spreadsheet dancing.'"
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/taylor_smith.png"
                  alt="Taylor Smith"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Taylor Smith</p>
                  <p className="text-sm text-gray-500">Professional Romantic Optimist</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "CAMUS helped me organize my closet by categorizing my clothes based on their 'emotional wavelength.' My wardrobe has never been more scientifically meaningless."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/olivia_martinez.png"
                  alt="Olivia Martinez"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Olivia Martinez</p>
                  <p className="text-sm text-gray-500">Wardrobe Physicist & Textile Theorist</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-gray-300 bg-beige p-6">
              <p className="mb-4 text-gray-700">
                "I asked CAMUS to create a workout routine. It suggested 45 minutes of 'mindful keyboard typing' followed by 'aggressive email breathing exercises.' I've never felt more professionally fit."
              </p>
              <div className="flex items-center">
                <Image
                  src="/profiles/jake_wilson.png"
                  alt="Jake Wilson"
                  width={40}
                  height={40}
                  className="mr-3 h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">Jake Wilson</p>
                  <p className="text-sm text-gray-500">Wellness Coordinator of Office Athletics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-sm border border-gray-300 bg-white p-8 text-center md:p-12">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-gray-800">
              Ready to Embrace Uselessness?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500">
              Join thousands of forward-thinking professionals who have embraced the power of doing nothing with style.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/agent">
                <Button size="lg" className="bg-taupe text-white hover:bg-taupe/90">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://github.com/js8544/camus" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Github className="mr-2 h-5 w-5" />
                  Star on GitHub
                </Button>
              </Link>
              <Link href="https://discord.gg/CTZknrkY" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Image
                    src="/Discord-Symbol-Black.svg"
                    alt="Discord"
                    width={20}
                    height={20}
                    className="mr-2 h-5 w-5"
                  />
                  Join Discord
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-gray-300 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-sm font-medium uppercase text-gray-400">Product</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                {["Features", "Solutions", "Pricing", "Updates"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-taupe">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-medium uppercase text-gray-400">Company</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                {["About", "Careers", "Contact", "Partners"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-taupe">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-medium uppercase text-gray-400">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                {["Blog", "Newsletter", "Events", "Help Center"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-taupe">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-medium uppercase text-gray-400">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                {["Terms", "Privacy", "Cookies", "Licenses"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-taupe">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-300 pt-8 text-center text-sm text-gray-500">
            <p className="mb-2">
              <span className="text-gray-400">Enjoyed the absurdity?</span>{" "}
              <a href="https://coff.ee/jinshang" target="_blank" rel="noopener noreferrer" className="text-taupe hover:underline">
                Buy me a coffee ☕
              </a>
            </p>
            <p>© 2025 Camus AI. All rights meaninglessly reserved.</p>
            <p className="mt-2">A satirical project critiquing AI hype culture.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
