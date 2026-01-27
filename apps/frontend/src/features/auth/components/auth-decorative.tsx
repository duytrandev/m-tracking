'use client'

import { m } from 'motion/react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { Shield, Zap, BarChart3 } from 'lucide-react'

/**
 * AuthDecorative component
 * Beautiful gradient background with decorative shapes and brand messaging
 * Inspired by Stripe, Linear, and modern SaaS login pages
 */
export function AuthDecorative() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 via-purple-500/30 to-pink-500/30 animate-pulse"
        style={{ animationDuration: '8s' }}
      />

      {/* Decorative circles */}
      <m.div
        className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <m.div
        className="absolute bottom-32 left-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Glass effect card with content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
        {/* Logo */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <span className="text-2xl font-semibold text-white">
              M-Tracking
            </span>
          </div>
        </m.div>

        {/* Main heading */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Track. Analyze.
            <br />
            Optimize.
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Modern marketing tracking platform for data-driven teams.
          </p>
        </m.div>

        {/* Features list */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {[
            {
              icon: Shield,
              title: 'Enterprise Security',
              description: 'Bank-level encryption and GDPR compliance',
            },
            {
              icon: Zap,
              title: 'Real-time Analytics',
              description: 'Track campaigns with millisecond precision',
            },
            {
              icon: BarChart3,
              title: 'Advanced Insights',
              description: 'AI-powered recommendations for growth',
            },
          ].map((feature, index) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="flex items-start space-x-4 group cursor-pointer"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors duration-200">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">
                  {feature.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </m.div>
          ))}
        </m.div>

        {/* Bottom testimonial */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-white/20"
        >
          <p className="text-white/90 italic mb-3">
            "M-Tracking transformed how we understand our customers. Best
            decision we made this year."
          </p>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">JD</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">John Doe</p>
              <p className="text-white/70 text-xs">CEO, TechCorp</p>
            </div>
          </div>
        </m.div>
      </div>

      {/* Decorative grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
