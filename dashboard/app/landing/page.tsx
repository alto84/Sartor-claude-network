"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  Home,
  Brain,
  Shield,
  ArrowRight,
  Sparkles,
  Users,
  Zap,
  ChevronRight,
  Heart,
  Star,
  Flame,
  Trophy,
  Link2,
  Quote,
} from "lucide-react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { Logo, NestlyIcon } from "@/components/brand/logo";

const features = [
  {
    icon: Calendar,
    title: "Calendar & Scheduling",
    description: "See everyone's schedule in one place. Color-coded by family member, synced with Google Calendar.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description: "Assign chores, track homework, and manage family to-dos. Everyone stays accountable.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Home,
    title: "Smart Home Control",
    description: "Control lights, locks, and thermostats. Set scenes for movie night or bedtime routines.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Brain,
    title: "AI Assistant (Claude)",
    description: "Ask anything about your family's schedule. Get smart suggestions and helpful reminders.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "Family Vault",
    description: "Securely store important documents, passwords, and precious family memories in one place.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Flame,
    title: "Gamification & Streaks",
    description: "Keep everyone motivated with achievement badges, streaks for completed chores, and family challenges.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Create Your Nest",
    description: "Sign up and set up your family's cozy digital home base in minutes.",
    icon: Home,
  },
  {
    step: "2",
    title: "Add Family Members",
    description: "Invite your family and create personalized profiles for each member.",
    icon: Users,
  },
  {
    step: "3",
    title: "Connect Your Services",
    description: "Link calendars, smart home devices, and other integrations you already use.",
    icon: Link2,
  },
  {
    step: "4",
    title: "Let Claude Help",
    description: "Your AI assistant learns your family's patterns and helps manage daily life.",
    icon: Brain,
  },
];

const testimonials = [
  {
    quote: "Finally, one place for everything. No more scattered apps and forgotten appointments.",
    author: "The Martinez Family",
    role: "Family of 5",
    avatar: "M",
  },
  {
    quote: "The kids actually love the chore chart now. The streaks and badges make it fun!",
    author: "Sarah & Tom",
    role: "Parents of twins",
    avatar: "S",
  },
  {
    quote: "Claude is like having a family assistant who never forgets anything. Game changer!",
    author: "David K.",
    role: "Single dad",
    avatar: "D",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-2">
              <Logo variant="full" size="md" animated />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/onboarding">Sign In</Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href="/onboarding">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4" />
                {brand.story.short}
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-primary">{brand.tagline}</span>
                <span className="block mt-2 text-foreground">for Your Family</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {brand.story.long} Calendars, tasks, smart home, AI assistant - everything
                your family needs in one beautifully organized nest.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 gap-2" asChild>
                  <Link href="/onboarding">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 gap-2">
                  <span>Watch Demo</span>
                  <Trophy className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                No credit card required. Free for families.
              </p>
            </motion.div>

            {/* Hero Visual - Pip Mascot & Dashboard Preview */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {/* Floating Pip Mascot */}
              <motion.div
                className="absolute -top-8 -left-4 z-20"
                variants={floatAnimation}
                initial="initial"
                animate="animate"
              >
                <div className="relative">
                  <Logo variant="icon" size="xl" animated />
                  <motion.div
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                  >
                    Pip says hi!
                  </motion.div>
                </div>
              </motion.div>

              {/* Dashboard Preview */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-full transform -translate-y-10" />
                <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 text-center text-sm text-muted-foreground">
                      app.nestly.family
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="col-span-2">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-sm">Today</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { time: "9:00 AM", event: "Team Standup", color: "bg-blue-500" },
                              { time: "3:00 PM", event: "School Pickup", color: "bg-green-500" },
                              { time: "5:00 PM", event: "Soccer Practice", color: "bg-orange-500" },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-xs text-muted-foreground w-16">{item.time}</span>
                                <span className="text-xs font-medium">{item.event}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="font-semibold text-sm">Streaks</span>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-orange-500">7</div>
                            <div className="text-xs text-muted-foreground">day streak!</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card className="mt-4">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-sm">Claude says...</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          &quot;Don&apos;t forget umbrella today - rain expected at 3pm during school pickup!&quot;
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything Your Family Needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for busy families, simple enough for everyone to use.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get Cozy in 4 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple setup, powerful results. Here&apos;s how it works.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                <div className="text-center">
                  <div className="relative inline-flex">
                    <motion.div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <step.icon className="h-10 w-10 text-primary" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-10 -right-4 h-8 w-8 text-muted-foreground/30" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by Families Everywhere
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of families who&apos;ve found their cozy command center.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-primary/20 mb-4" />
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-bold text-lg text-primary-foreground">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative text-center bg-gradient-to-br from-primary via-primary to-green-600 rounded-3xl p-12 text-primary-foreground overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <NestlyIcon size={64} className="mx-auto mb-6 opacity-90" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Start Your Free Nest Today
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of families who&apos;ve made {brand.name} their home base.
                No credit card required.
              </p>
              <Button size="lg" variant="secondary" className="text-lg px-8 gap-2 shadow-lg" asChild>
                <Link href="/onboarding">
                  Build Your Nest
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Logo variant="full" size="md" />
              </div>
              <p className="text-muted-foreground max-w-sm mb-4">
                {brand.story.long}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-rose-500" />
                <span>Made with love for families everywhere</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Calendar</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Tasks</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Smart Home</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Family Vault</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">AI Assistant</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <NestlyIcon size={20} />
              <span>Your cozy command center</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
