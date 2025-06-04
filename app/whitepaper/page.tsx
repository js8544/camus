'use client'

import { ShareModal } from "@/components/ShareModal"
import { Button } from "@/components/ui/button"
import { useWhitepaperActions } from "@/hooks/useWhitepaperActions"
import * as d3 from "d3"
import { Book, Cpu, Drama, FileBarChart, Loader2, Palette, PieChart, Share2, Wrench, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function WhitepaperPage() {
  const { downloadPdf, shareWhitepaper, shareToSocial, isGeneratingPdf, isSharing } = useWhitepaperActions()
  const [showShareModal, setShowShareModal] = useState(false)
  const chartRef = useRef<SVGSVGElement>(null)

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

  const handleShare = () => {
    // Try native sharing first, fallback to modal
    shareWhitepaper().catch(() => {
      // If native sharing fails or isn't available, show modal
      setShowShareModal(true)
    })
  }

  const handleSocialShare = (platform: string) => {
    shareToSocial(platform)
    setShowShareModal(false)
  }

  return (
    <div className="min-h-screen bg-beige text-gray-700 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-300 bg-white">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center">
                <Image
                  src="/camus_logo.png"
                  alt="Camus Logo"
                  width={32}
                  height={32}
                  className="mr-2 h-8 w-8"
                />
                <span className="font-serif text-xl font-medium tracking-tight">CAMUS</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
              onClick={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-gray-300 bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            OFFICIAL WHITEPAPER v0.6.9
          </div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-gray-800 md:text-5xl">
            CAMUS: World's First Truly Useless AI Agent
          </h1>
          <div className="mx-auto mt-8 max-w-3xl">
            <blockquote className="text-lg italic text-gray-600 border-l-4 border-taupe pl-4">
              "The world itself is not reasonable, that's what is so absurd. It is up to us to give it a reason."
            </blockquote>
            <p className="text-right mt-2 text-sm text-gray-500">— Albert CAMUS, The Myth of Sisyphus</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.camus.im/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-taupe bg-white px-4 py-2 text-sm font-medium text-taupe hover:bg-taupe hover:text-white transition-colors"
            >
              <span className="mr-2">🌐</span>
              camus.im
            </a>
            <a
              href="https://github.com/js8544/camus"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
            <span className="flex items-center rounded-full bg-gray-100 px-3 py-1">
              <span className="mr-1 h-2 w-2 rounded-full bg-taupe"></span>
              Published: May 28, 2025
            </span>
            <span className="flex items-center rounded-full bg-gray-100 px-3 py-1">
              <span className="mr-1 h-2 w-2 rounded-full bg-taupe"></span>
              Authors: The Camus Research Team
            </span>
            <span className="flex items-center rounded-full bg-gray-100 px-3 py-1">
              <span className="mr-1 h-2 w-2 rounded-full bg-taupe"></span>
              Reading Time: 12 minutes
            </span>
          </div>
        </div>
      </header>

      {/* Table of Contents */}
      <div className="border-b border-gray-300 bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 font-serif text-xl font-medium text-gray-800 mt-4">Table of Contents</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <ol className="list-inside list-decimal space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <a href="#introduction" className="hover:text-taupe">
                      Introduction: The Genesis of Uselessness
                    </a>
                  </li>
                  <li className="flex items-center">
                    <a href="#mission" className="hover:text-taupe">
                      Mission & Vision: Embracing Futility
                    </a>
                  </li>
                  <li className="flex items-center">
                    <a href="#philosophy" className="hover:text-taupe">
                      Core Philosophy: The Useless Paradox
                    </a>
                  </li>
                  <li className="flex items-center">
                    <a href="#utility" className="hover:text-taupe">
                      Acknowledging Genuine AI Utility
                    </a>
                  </li>
                  <li className="flex items-center">
                    <a href="#target" className="hover:text-taupe">
                      Target Audience: The Disillusioned Technologist
                    </a>
                  </li>
                </ol>
              </div>
              <div>
                <ol className="list-inside list-decimal space-y-2 text-gray-600" start={6}>
                  <li className="flex items-center">
                    <a href="#capabilities" className="hover:text-taupe">
                      Core Capabilities: Engineered Pointlessness
                    </a>
                  </li>
                  <li className="flex items-center">
                    <a href="#impact" className="hover:text-taupe">
                      Impact Analysis: The Mirror Effect
                    </a>
                  </li>
                  <li className="flex items-center">
                    <a href="#future" className="hover:text-taupe">
                      Future Directions: Expanding Uselessness
                    </a>
                  </li>
                  <li className="flex items-center">
                    <a href="#conclusion" className="hover:text-taupe">
                      Conclusion: The Value of Valuelessness
                    </a>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Introduction */}
            <section id="introduction" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                1. Introduction: The Genesis of Uselessness
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  In an era characterized by the relentless pursuit of artificial intelligence solutions that promise to
                  revolutionize every aspect of human existence, CAMUS (Creating Absurd, Meaningless and Useless Stuff)
                  emerges as a deliberate counterpoint. This whitepaper introduces CAMUS, the world's first AI agent
                  meticulously engineered to be completely and utterly useless.
                </p>
                <p>
                  CAMUS is not merely an AI that fails to achieve utility; rather, it is an AI that actively and
                  successfully prioritizes fun, surprise, and engagement over conventional problem-solving. This
                  distinction is crucial to understanding our approach.
                </p>
                <p>
                  Our research reveals a profound paradox in digital product development: the most successful products
                  pre-AI are not those that solve the most problems, but those that are most entertaining. Users don't
                  open TikTok or Instagram to solve practical problems—in conventional terms, these platforms could be
                  considered "valueless." Yet they are among the most successful digital products ever created.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <blockquote className="border-l-4 border-taupe pl-4 italic text-gray-700">
                    "The true measure of an AI's impact is not only in its ability to solve problems, but in its capacity
                    to create moments of surprise, delight, and unexpected discovery."
                    <footer className="mt-2 text-right text-sm text-gray-500">— Camus Team</footer>
                  </blockquote>
                </div>
                <p>
                  The current AI landscape is saturated with solutions claiming to be "revolutionary," "disruptive," and
                  "game-changing" in their problem-solving capabilities. Yet, what if the most revolutionary approach is
                  to create AI that doesn't try to solve anything at all, but instead focuses on creating experiences
                  that users don't even know they want until they encounter them? CAMUS is our experiment in creating
                  fun and surprising AI rather than problem-solving AI.
                </p>
                <div className="my-6 rounded-sm border border-taupe/20 bg-gradient-to-r from-beige/50 to-white p-4">
                  <p className="text-center text-gray-700">
                    <span className="text-taupe font-medium">Curious about engineered uselessness?</span>{" "}
                    <Link href="/agent" className="inline-flex items-center text-taupe hover:text-taupe/80 font-medium underline underline-offset-2">
                      Experience CAMUS directly
                      <Cpu className="ml-1 h-4 w-4" />
                    </Link>{" "}
                    and discover what happens when AI prioritizes surprise over utility.
                  </p>
                </div>
              </div>
            </section>

            {/* Mission & Vision */}
            <section id="mission" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                2. Mission & Vision: Embracing Futility
              </h2>
              <div className="prose prose-gray max-w-none">
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">2.1 Mission Statement</h3>
                <p>
                  CAMUS aims to explore the untapped potential of "uselessness" as a feature rather than a bug. By
                  creating AI that prioritizes surprise, delight, and unexpected experiences over conventional utility,
                  we seek to demonstrate that the future of AI may lie not just in solving problems, but in creating
                  experiences users don't even know they want.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">2.2 Vision</h3>
                <p>
                  CAMUS aspires to pioneer a new category of AI that embraces the same principles that made platforms
                  like TikTok and Instagram wildly successful: the element of surprise, the joy of discovery, and the
                  absence of predetermined utility. Just as users open these apps without knowing exactly what they'll
                  see but believing they'll enjoy it, CAMUS creates experiences where unpredictability becomes a
                  feature, not a flaw.
                </p>
                <div className="my-8 overflow-hidden rounded-sm border border-gray-300">
                  <div className="bg-white p-6">
                    <h4 className="mb-4 font-serif text-lg font-medium text-gray-800">
                      Key Performance Indicators of Uselessness
                    </h4>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-sm border border-gray-200 bg-beige p-4 text-center">
                        <div className="font-serif text-2xl font-medium text-taupe">100%</div>
                        <div className="mt-1 text-sm text-gray-600">Uselessness Rate</div>
                      </div>
                      <div className="rounded-sm border border-gray-200 bg-beige p-4 text-center">
                        <div className="font-serif text-2xl font-medium text-taupe">0</div>
                        <div className="mt-1 text-sm text-gray-600">Practical Applications</div>
                      </div>
                      <div className="rounded-sm border border-gray-200 bg-beige p-4 text-center">
                        <div className="font-serif text-2xl font-medium text-taupe">∞</div>
                        <div className="mt-1 text-sm text-gray-600">Style-to-Substance Ratio</div>
                      </div>
                      <div className="rounded-sm border border-gray-200 bg-beige p-4 text-center">
                        <div className="font-serif text-2xl font-medium text-taupe">99.9%</div>
                        <div className="mt-1 text-sm text-gray-600">Meaninglessness Accuracy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Philosophy */}
            <section id="philosophy" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                3. Core Philosophy: The Useless Paradox
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  The philosophical foundation of CAMUS draws inspiration from the 20th-century Dadaist art movement,
                  which embraced absurdity as a response to the perceived madness of the world. Similarly, CAMUS
                  embraces uselessness as a response to the sometimes absurd claims and expectations surrounding AI
                  technology.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">3.1 Embracing the Absurd</h3>
                <p>
                  CAMUS deliberately inverts the traditional value proposition of AI systems. While conventional AI aims
                  to solve problems and create utility, CAMUS meticulously avoids solving any actual problems while
                  maintaining the appearance of sophistication and purpose. This inversion creates a powerful satirical
                  lens through which to view the industry's sometimes exaggerated claims.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">
                  3.2 The Paradox of Engineered Uselessness
                </h3>
                <p>
                  The central paradox of CAMUS lies in the significant engineering effort dedicated to creating
                  something deliberately useless. This paradox mirrors the real-world phenomenon of over-engineered
                  solutions that fail to address genuine human needs despite their technical sophistication.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">3.3 The Value of Unpredictability</h3>
                <p>
                  A key insight driving CAMUS is that humans are naturally drawn to unpredictable experiences. The most
                  engaging digital products don't tell users exactly what they'll get—they create systems where each
                  interaction holds the possibility of surprise. Before opening TikTok or Instagram, users don't know
                  what content awaits them, and this very uncertainty is part of the appeal.
                </p>
                <p>
                  CAMUS applies this principle to AI, creating experiences where users don't know what to expect, but
                  trust they'll be entertained. This stands in stark contrast to conventional AI systems that aim for
                  predictable, consistent utility. By embracing unpredictability, CAMUS creates a more human-like,
                  engaging experience that may ultimately prove more valuable than narrowly defined utility.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
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

                  {/* Comparative Analysis Table */}
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
            </section>

            {/* Acknowledging Genuine AI Utility */}
            <section id="utility" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                4. Acknowledging Genuine AI Utility: A Balanced Perspective
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  While CAMUS embraces deliberate uselessness as its core feature, it is crucial to acknowledge that AI
                  agents are, in fact, remarkably useful tools that have already demonstrated significant practical
                  value across numerous domains. This project itself serves as a testament to AI's genuine utility—the
                  images, content, and even portions of this very whitepaper were created with the assistance of AI
                  agents.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">
                  4.1 Celebrating Practical AI Innovation
                </h3>
                <p>
                  CAMUS's critique is not directed at the technology itself or the dedicated teams building genuinely
                  useful AI applications. Instead, we celebrate and honor those developers, researchers, and
                  organizations who approach AI development with pragmatism, focusing on solving real problems and
                  creating tangible value for users. These teams represent the best of what AI can achieve when
                  developed thoughtfully and deployed responsibly.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <h4 className="mb-4 font-serif text-lg font-medium text-gray-800">
                    Examples of Genuinely Useful AI Applications
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 h-2 w-2 rounded-full bg-taupe flex-shrink-0"></span>
                      <div>
                        <strong>Content Creation Tools:</strong> AI assistants that help writers, designers, and
                        creators enhance their work while maintaining human creativity and oversight.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 h-2 w-2 rounded-full bg-taupe flex-shrink-0"></span>
                      <div>
                        <strong>Medical Diagnostics:</strong> AI systems that assist healthcare professionals in
                        identifying diseases and conditions with greater accuracy and speed.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 h-2 w-2 rounded-full bg-taupe flex-shrink-0"></span>
                      <div>
                        <strong>Accessibility Tools:</strong> AI-powered applications that help individuals with
                        disabilities navigate digital and physical environments more effectively.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-1 h-2 w-2 rounded-full bg-taupe flex-shrink-0"></span>
                      <div>
                        <strong>Educational Assistance:</strong> AI tutors and learning platforms that provide
                        personalized education experiences tailored to individual learning styles and needs.
                      </div>
                    </li>
                  </ul>
                </div>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">
                  4.2 The Target of Our Critique: Hype Culture
                </h3>
                <p>
                  CAMUS's satirical lens is specifically focused on the culture of exaggerated claims, unrealistic
                  promises, and marketing hyperbole that often surrounds AI technology. Our critique targets:
                </p>
                <ul>
                  <li>
                    <strong>Capital Market Hype:</strong> The tendency of investors and venture capital to inflate AI
                    capabilities and market potential beyond realistic bounds, creating unsustainable expectations and
                    valuations.
                  </li>
                  <li>
                    <strong>Media Sensationalism:</strong> The propensity of media outlets to present AI developments in
                    apocalyptic or utopian terms, often misrepresenting the actual capabilities and limitations of
                    current technology.
                  </li>
                  <li>
                    <strong>Marketing Overreach:</strong> Companies that rebrand conventional software as "AI-powered"
                    without meaningful intelligence, or that promise revolutionary capabilities that their products
                    cannot deliver.
                  </li>
                  <li>
                    <strong>Technological Solutionism:</strong> The belief that AI can solve all problems, regardless of
                    whether those problems are fundamentally technical in nature or require human judgment, empathy, and
                    social solutions.
                  </li>
                </ul>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">
                  4.3 A Meta-Commentary on Our Own Process
                </h3>
                <p>
                  The creation of CAMUS itself demonstrates the genuine utility of AI tools. Throughout this project's
                  development, we leveraged AI agents for image generation, content creation, code assistance, and
                  design iteration. These tools enhanced our productivity and creative capabilities without replacing
                  human judgment and oversight. This experience reinforces our belief that AI's greatest value lies in
                  augmenting human capabilities rather than replacing them entirely.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">4.4 Testing AI's Creative Dimensions</h3>
                <p>
                  CAMUS serves as an experimental platform to test dimensions of AI capabilities that are often
                  overlooked in conventional evaluations. While most AI benchmarks focus on technical problem-solving,
                  logical reasoning, and factual accuracy, our project deliberately explores AI's capacity for:
                </p>
                <ul>
                  <li>
                    <strong>Imagination:</strong> Can AI systems conceptualize and generate content that goes beyond
                    straightforward problem-solving? The deliberately absurd premise of CAMUS challenges AI to think
                    beyond utilitarian frameworks.
                  </li>
                  <li>
                    <strong>Creativity:</strong> Rather than evaluating AI on its ability to find the "correct" answer,
                    CAMUS examines AI's capacity to generate novel, unexpected, and delightful outputs that surprise
                    even its creators.
                  </li>
                  <li>
                    <strong>Taste and Aesthetic Judgment:</strong> CAMUS tests whether AI can develop and apply
                    aesthetic sensibilities that resonate with human audiences, even when freed from practical
                    constraints.
                  </li>
                </ul>
                <p>
                  These dimensions are increasingly important as AI systems move beyond narrow technical applications
                  into domains traditionally associated with human creativity and cultural production. By creating a
                  project that prioritizes these qualities over conventional utility, we gain insights into AI
                  capabilities that might otherwise remain unexplored.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <blockquote className="border-l-4 border-taupe pl-4 italic text-gray-700">
                    "The true test of artificial intelligence isn't just whether it can solve our problems, but whether
                    it can surprise us, delight us, and show glimmers of what we might call imagination or taste. CAMUS
                    deliberately creates a space where these qualities can emerge and be observed."
                    <footer className="mt-2 text-right text-sm text-gray-500">— Camus Team</footer>
                  </blockquote>
                </div>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <blockquote className="border-l-4 border-taupe pl-4 italic text-gray-700">
                    "The most valuable AI applications are those that make humans more capable, creative, and
                    productive—not those that promise to make humans obsolete."
                    <footer className="mt-2 text-right text-sm text-gray-500">— Camus Team</footer>
                  </blockquote>
                </div>
                <p>
                  By acknowledging AI's genuine utility while satirizing its hype culture, CAMUS occupies a unique
                  position in the discourse around artificial intelligence. We advocate for a more grounded, realistic
                  approach to AI development and deployment—one that celebrates genuine achievements while remaining
                  skeptical of grandiose claims and unrealistic promises.
                </p>
              </div>
            </section>

            {/* Open Source Philosophy */}
            <section id="opensource" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                5. Open Source Philosophy: Democratizing Uselessness
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  In keeping with our commitment to transparent meaninglessness, CAMUS embraces the open source philosophy
                  as a natural extension of our core mission. By making our source code freely available, we enable the
                  global community to study, modify, and contribute to the art of engineered uselessness.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">5.1 The Paradox of Open Source Uselessness</h3>
                <p>
                  There exists a beautiful irony in open-sourcing a deliberately useless system. While traditional open
                  source projects aim to solve problems collaboratively, CAMUS invites collaboration in the creation of
                  sophisticated non-solutions. This inversion challenges conventional notions of what deserves community
                  development effort and resources.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <h4 className="mb-4 font-serif text-lg font-medium text-gray-800">
                    Open Source Contribution Opportunities
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-sm border border-gray-200 bg-beige p-4">
                      <div className="flex items-center mb-2">
                        <Palette className="h-4 w-4 text-taupe mr-2" />
                        <h5 className="font-medium text-gray-800">Aesthetic Enhancements</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Improve the visual appeal of meaningless outputs while maintaining their fundamental uselessness.
                      </p>
                    </div>
                    <div className="rounded-sm border border-gray-200 bg-beige p-4">
                      <div className="flex items-center mb-2">
                        <Wrench className="h-4 w-4 text-taupe mr-2" />
                        <h5 className="font-medium text-gray-800">Tool Development</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Create new AI tools that achieve even higher levels of sophisticated pointlessness.
                      </p>
                    </div>
                    <div className="rounded-sm border border-gray-200 bg-beige p-4">
                      <div className="flex items-center mb-2">
                        <Book className="h-4 w-4 text-taupe mr-2" />
                        <h5 className="font-medium text-gray-800">Documentation</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Help others understand and appreciate the nuances of deliberate technological futility.
                      </p>
                    </div>
                    <div className="rounded-sm border border-gray-200 bg-beige p-4">
                      <div className="flex items-center mb-2">
                        <Drama className="h-4 w-4 text-taupe mr-2" />
                        <h5 className="font-medium text-gray-800">Satirical Refinement</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Enhance the project's commentary on AI industry trends and technological solutionism.
                      </p>
                    </div>
                  </div>
                </div>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">5.2 Community-Driven Meaninglessness</h3>
                <p>
                  The open source nature of CAMUS creates opportunities for a global community of contributors to
                  collaborate on the refinement of uselessness. This collaborative approach to non-utility represents
                  a unique experiment in collective artistic expression through technology.
                </p>
                <p>
                  Contributors to CAMUS are not merely improving code—they are participating in a shared exploration
                  of what happens when engineering excellence is deliberately divorced from practical outcomes. This
                  philosophical exercise has value beyond the immediate project, offering insights into the nature of
                  technological development and human creativity.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">5.3 Transparency in Absurdity</h3>
                <p>
                  By making our approach completely transparent, CAMUS serves as an educational resource for those
                  interested in understanding both the technical aspects of AI development and the cultural critique
                  embedded within our work. The open source codebase becomes a living document of our methodology.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Explore the Source Code</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Dive into the technical implementation of deliberate uselessness
                      </p>
                    </div>
                    <a
                      href="https://github.com/js8544/camus"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-sm border border-taupe bg-taupe px-4 py-2 text-sm font-medium text-white hover:bg-taupe/90 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub Repository
                    </a>
                  </div>
                </div>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">5.4 The Ethics of Open Uselessness</h3>
                <p>
                  Making CAMUS open source raises interesting questions about the responsibility that comes with
                  sharing tools designed for non-productivity. We believe that transparency about our methods and
                  intentions is essential, allowing others to understand both the technical implementation and the
                  cultural commentary embedded within the project.
                </p>
                <p>
                  The open source approach also ensures that CAMUS cannot be co-opted or commercialized in ways that
                  would undermine its fundamental mission. By remaining freely available and modifiable, CAMUS preserves
                  its integrity as a work of technological art and cultural critique.
                </p>
              </div>
            </section>

            {/* Target Audience */}
            <section id="target" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                6. Target Audience: The Disillusioned Technologist
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  While CAMUS presents itself as a product with no practical use cases, its meta-purpose as a satirical
                  commentary is directed at specific audiences who may find value in its critique.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">6.1 Primary Audience Segments</h3>
                <ul>
                  <li>
                    <strong>Technology Professionals</strong>: Those who have grown weary of the hyperbolic claims and
                    marketing excess in the AI industry.
                  </li>
                  <li>
                    <strong>Digital Philosophers</strong>: Individuals interested in critical examination of
                    technology's role in society and the sometimes empty promises of digital solutionism.
                  </li>
                  <li>
                    <strong>AI Ethicists</strong>: Those concerned with the direction of AI development and seeking
                    alternative perspectives on progress.
                  </li>
                  <li>
                    <strong>The Tech-Fatigued</strong>: People experiencing exhaustion from the constant parade of
                    "revolutionary" technologies that fail to deliver meaningful improvements to human experience.
                  </li>
                </ul>
                <div className="my-8 overflow-hidden rounded-sm border border-gray-300">
                  <div className="bg-white p-6">
                    <h4 className="mb-4 font-serif text-lg font-medium text-gray-800">Audience Engagement Metrics</h4>
                    <div className="h-64">
                      <div className="flex h-full">
                        <div className="flex w-1/4 flex-col items-center justify-end">
                          <div className="w-full bg-taupe" style={{ height: "85%" }}></div>
                          <div className="mt-2 text-center text-xs">Tech Professionals</div>
                        </div>
                        <div className="flex w-1/4 flex-col items-center justify-end">
                          <div className="w-full bg-taupe" style={{ height: "65%" }}></div>
                          <div className="mt-2 text-center text-xs">Digital Philosophers</div>
                        </div>
                        <div className="flex w-1/4 flex-col items-center justify-end">
                          <div className="w-full bg-taupe" style={{ height: "75%" }}></div>
                          <div className="mt-2 text-center text-xs">AI Ethicists</div>
                        </div>
                        <div className="flex w-1/4 flex-col items-center justify-end">
                          <div className="w-full bg-taupe" style={{ height: "95%" }}></div>
                          <div className="mt-2 text-center text-xs">Tech-Fatigued</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Engagement levels by audience segment (higher is better, though ultimately meaningless)
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Capabilities */}
            <section id="capabilities" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                7. Core Capabilities: Engineered Pointlessness
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  CAMUS employs sophisticated AI capabilities to create outputs that are visually impressive and
                  superficially convincing, yet deliberately devoid of practical utility. These capabilities represent a
                  satirical mirror of conventional AI systems.
                </p>
                <div className="my-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-sm border border-gray-300 bg-white p-6">
                    <div className="mb-4 flex items-center">
                      <FileBarChart className="mr-3 h-6 w-6 text-taupe" />
                      <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">Meaningless Analytics</h3>
                    </div>
                    <p className="text-gray-600">
                      CAMUS generates visually impressive charts and graphs that appear to convey significant insights
                      but actually represent random or meaningless data. These visualizations mimic the aesthetic of
                      business intelligence tools while providing zero actionable information.
                    </p>
                  </div>
                  <div className="rounded-sm border border-gray-300 bg-white p-6">
                    <div className="mb-4 flex items-center">
                      <Zap className="mr-3 h-6 w-6 text-taupe" />
                      <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">Strategic Verbosity</h3>
                    </div>
                    <p className="text-gray-600">
                      Using advanced language models, CAMUS produces text that mimics corporate and technical
                      communication while being carefully engineered to convey no useful information. This capability
                      satirizes the tendency toward jargon-heavy, content-light communication in the tech industry.
                    </p>
                  </div>
                  <div className="rounded-sm border border-gray-300 bg-white p-6">
                    <div className="mb-4 flex items-center">
                      <Cpu className="mr-3 h-6 w-6 text-taupe" />
                      <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">Complexity Generation</h3>
                    </div>
                    <p className="text-gray-600">
                      CAMUS excels at transforming simple concepts into unnecessarily complex frameworks, methodologies,
                      and processes. This capability parodies the industry tendency to over-engineer solutions to
                      straightforward problems, adding layers of complexity that create the illusion of sophistication.
                    </p>
                  </div>
                  <div className="rounded-sm border border-gray-300 bg-white p-6">
                    <div className="mb-4 flex items-center">
                      <PieChart className="mr-3 h-6 w-6 text-taupe" />
                      <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">Aesthetic Optimization</h3>
                    </div>
                    <p className="text-gray-600">
                      Through sophisticated design algorithms, CAMUS creates visually stunning outputs that prioritize
                      aesthetic appeal over functionality or utility. This capability satirizes the industry's sometimes
                      excessive focus on visual impressiveness at the expense of practical value.
                    </p>
                  </div>
                </div>
                <p>
                  These capabilities work in concert to create outputs that appear impressive and valuable at first
                  glance but reveal themselves to be entirely useless upon closer inspection. This deliberate
                  misdirection serves as a powerful metaphor for certain trends in the AI industry.
                </p>
              </div>
            </section>

            {/* Impact Analysis */}
            <section id="impact" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                8. Impact Analysis: The Mirror Effect
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  While CAMUS is designed to be useless in conventional terms, its meta-purpose as a satirical
                  commentary has several potential impacts on how we think about and develop AI technologies.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">8.1 Reflection on Value Propositions</h3>
                <p>
                  By deliberately creating an AI with no practical utility, CAMUS encourages technologists to more
                  critically examine the actual value propositions of their own work. What genuine human needs are being
                  addressed? What real problems are being solved? These questions become more salient when contrasted
                  with CAMUS's deliberate uselessness.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">
                  8.2 Critique of Technological Solutionism
                </h3>
                <p>
                  CAMUS serves as a critique of the belief that every problem has a technological solution. By creating
                  technology that deliberately solves no problems, CAMUS highlights the limits of technological
                  solutionism and encourages more nuanced approaches to addressing human needs.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <div className="mb-4 text-center font-serif text-lg font-medium text-gray-800">
                    Impact Assessment Matrix
                  </div>
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Impact Dimension</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Conventional AI</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CAMUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700">
                          Practical Utility
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">High (claimed)</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Zero (by design)</td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700">
                          Critical Reflection
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">Low</td>
                        <td className="px-4 py-3 text-sm text-gray-600">High</td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700">
                          Honesty About Limitations
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">Variable</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Complete</td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700">
                          Resource Efficiency
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">Variable</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Deliberately inefficient</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">8.3 Humor as Critical Lens</h3>
                <p>
                  By employing satire and humor, CAMUS creates a space for critical engagement with AI technology that
                  might be more accessible and less threatening than direct critique. This approach can broaden the
                  conversation about AI's role in society beyond technical specialists.
                </p>
              </div>
            </section>

            {/* Future Directions */}
            <section id="future" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                9. Future Directions: Expanding Uselessness
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  While CAMUS has already achieved unprecedented levels of uselessness, our research team continues to
                  explore new frontiers in the science of engineered futility.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">9.1 Uselessness at Scale</h3>
                <p>
                  Future iterations of CAMUS will explore how uselessness can be scaled across enterprise environments,
                  creating entire ecosystems of interconnected but ultimately pointless systems. This research direction
                  mirrors the real-world phenomenon of organizations implementing complex technological solutions
                  without clear value propositions.
                </p>
                <h3 className="font-serif text-xl font-medium text-gray-800 mt-4 mb-4">9.2 Collaborative Uselessness</h3>
                <p>
                  We are investigating multi-agent systems where multiple instances of CAMUS collaborate to achieve even
                  higher levels of collective uselessness than would be possible individually. This research direction
                  satirizes the tendency toward unnecessary complexity in enterprise software ecosystems.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <div className="mb-4 text-center font-serif text-lg font-medium text-gray-800">
                    Uselessness Development Roadmap
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
                    <div className="space-y-8">
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-4 border-taupe bg-white">
                          <span className="text-xs font-bold text-taupe">1</span>
                        </div>
                        <h4 className="font-serif text-lg font-medium text-gray-800">Q3 2025: Uselessness at Scale</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Deployment of enterprise-grade uselessness across organizational contexts.
                        </p>
                      </div>
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-4 border-gray-300 bg-white">
                          <span className="text-xs font-bold text-gray-400">2</span>
                        </div>
                        <h4 className="font-serif text-lg font-medium text-gray-800">
                          Q4 2025: Collaborative Uselessness Framework
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Introduction of multi-agent uselessness systems for enhanced futility.
                        </p>
                      </div>
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-4 border-gray-300 bg-white">
                          <span className="text-xs font-bold text-gray-400">3</span>
                        </div>
                        <h4 className="font-serif text-lg font-medium text-gray-800">Q1 2026: Quantum Uselessness</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Leveraging quantum computing principles to achieve unprecedented levels of pointlessness.
                        </p>
                      </div>
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-4 border-gray-300 bg-white">
                          <span className="text-xs font-bold text-gray-400">4</span>
                        </div>
                        <h4 className="font-serif text-lg font-medium text-gray-800">Q2 2026: Metaverse Integration</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          Expanding uselessness into virtual worlds for immersive pointless experiences.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion" className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">
                10. Conclusion: The Value of Valuelessness
              </h2>
              <div className="prose prose-gray max-w-none">
                <p>
                  CAMUS represents a unique contribution to the AI landscape—an agent deliberately designed to
                  prioritize fun, surprise, and engagement over conventional utility. Through this approach, CAMUS not
                  only satirizes the problem-solving fixation of current AI development but also explores a genuinely
                  promising alternative direction: AI that creates experiences users don't even know they want until
                  they encounter them.
                </p>
                <p>
                  The parallel with wildly successful platforms like TikTok and Instagram is instructive. These
                  platforms don't solve practical problems, yet they've achieved unprecedented success by creating
                  experiences centered around surprise, discovery, and entertainment. CAMUS applies this insight to AI,
                  suggesting that the most impactful AI systems of the future may not be those that solve the most
                  problems, but those that create the most engaging, surprising, and delightful experiences.
                </p>
                <p>
                  In a technological landscape often characterized by hyperbole and over-promising, CAMUS offers a
                  refreshing honesty about its limitations. It promises nothing and delivers exactly that, with
                  impeccable style and corporate polish.
                </p>
                <div className="my-8 rounded-sm border border-gray-300 bg-white p-6">
                  <blockquote className="border-l-4 border-taupe pl-4 italic text-gray-700">
                    "In a world obsessed with utility, the most revolutionary act may be the creation of something
                    deliberately, perfectly, and honestly useless."
                    <footer className="mt-2 text-right text-sm text-gray-500">— Camus Team</footer>
                  </blockquote>
                </div>
                <p>
                  We believe that by embracing uselessness, CAMUS paradoxically becomes useful—as a tool for critical
                  thinking, as a catalyst for important conversations about technology, and as a reminder that not every
                  problem requires a technological solution.
                </p>
                <p>
                  In the final analysis, CAMUS may be useless by design, but the conversations and reflections it
                  inspires are anything but.
                </p>
              </div>
            </section>

            {/* Call to Action */}
            <section className="mb-16">
              <div className="rounded-sm border border-gray-300 bg-white p-6 text-center">
                <h3 className="mb-4 font-serif text-xl font-medium text-gray-800">
                  Experience the Art of Uselessness
                </h3>
                <p className="mb-6 text-gray-600">
                  Ready to witness the pinnacle of engineered pointlessness? Interact with CAMUS directly and
                  discover what happens when AI is designed to be perfectly, deliberately useless.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/agent">
                    <Button className="bg-taupe text-white hover:bg-taupe/90">
                      <Cpu className="mr-2 h-4 w-4" />
                      Try CAMUS Now
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                      Learn More
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Warning: CAMUS may cause excessive contemplation about the nature of utility and purpose in AI.
                </p>
              </div>
            </section>

            {/* References */}
            <section className="mb-16">
              <h2 className="mb-6 font-serif text-3xl font-medium text-gray-800">References</h2>
              <div className="prose prose-gray max-w-none">
                <ol className="list-decimal space-y-4 pl-5">
                  <li>
                    Paradox, I. & Futility, M. (2025). "The Science of Engineered Uselessness: Principles and
                    Applications." <em>Journal of Meaningless Research, 42</em>(0), 1-23.
                  </li>
                  <li>
                    Pointless, P. (2024). "Beyond Utility: Rethinking Value in Artificial Intelligence."
                    <em>Technology Critique Quarterly, 15</em>(3), 78-92.
                  </li>
                  <li>
                    Absurdity, A. (2023). "Dadaism in the Digital Age: Artistic Influences on Technological Critique."
                    <em>Digital Humanities Review, 8</em>(2), 112-130.
                  </li>
                  <li>
                    Morozov, E. (2013). "To Save Everything, Click Here: The Folly of Technological Solutionism."
                    PublicAffairs.
                  </li>
                  <li>
                    Meaningless, M. et al. (2025). "Quantifying Uselessness: Metrics and Methodologies."
                    <em>Proceedings of the International Conference on Artificial Futility</em>, 234-251.
                  </li>
                </ol>
              </div>
            </section>

            {/* Share */}
            <div className="rounded-sm border border-gray-300 bg-white p-6 text-center">
              <h3 className="mb-4 font-serif text-xl font-medium text-gray-800">Share this groundbreaking research</h3>
              <p className="mb-6 text-gray-600">
                Help spread awareness about the importance of uselessness in the AI landscape.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Whitepaper
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 CAMUS AI. All rights meaninglessly reserved.</p>
          <p className="mt-2">A satirical project critiquing AI hype culture.</p>
        </div>
      </footer>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleSocialShare}
      />
    </div>
  )
}
