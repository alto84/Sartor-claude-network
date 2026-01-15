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
  Clock,
  Zap,
  ChevronRight,
  Heart,
  Star,
  Bird,
} from "lucide-react";
import Link from "next/link";
import { brand } from "@/lib/brand";

const features = [
  {
    icon: Calendar,
    title: "Unified Calendar",
    description: "See everyone's schedule in one place. Color-coded by family member, synced with Google Calendar.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: CheckSquare,
    title: "Shared Tasks",
    description: "Assign chores, track homework, and manage family to-dos. Everyone stays accountable.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Home,
    title: "Smart Home Control",
    description: "Control lights, locks, and thermostats. Set scenes for movie night or bedtime.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Brain,
    title: "AI Assistant",
    description: "Ask anything about your family's schedule, get reminders, and receive smart suggestions.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "Family Vault",
    description: "Securely store important documents, passwords, and family memories in one place.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Users,
    title: "Family Profiles",
    description: "Each member has their own profile, preferences, and personalized experience.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Build Your Nest",
    description: "Add family members, set up profiles, and customize preferences.",
    icon: Users,
  },
  {
    step: "2",
    title: "Connect Your World",
    description: "Link calendars, smart home devices, and other integrations.",
    icon: Zap,
  },
  {
    step: "3",
    title: "Thrive Together",
    description: "Use the dashboard daily to stay organized, connected, and cozy.",
    icon: Heart,
  },
];

const testimonials = [
  {
    quote: "Finally, a place where our family's chaos makes sense. Morning routines are so much smoother now.",
    author: "The Martinez Family",
    role: "Family of 5",
    avatar: "M",
  },
  {
    quote: "The AI assistant remembers everything - soccer practice, allergies, birthdays. It's like having a personal family assistant.",
    author: "Sarah & Tom",
    role: "Parents of twins",
    avatar: "S",
  },
  {
    quote: "My kids actually complete their chores now that they can check them off themselves. Game changer!",
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

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-green-600 text-primary-foreground">
                <Bird className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">{brand.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/onboarding">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/onboarding">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
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
              {brand.tagline}
              <span className="text-primary block mt-2">for Your Family</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {brand.story.long}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/onboarding">
                  Build Your Nest
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                <span>Watch Demo</span>
                <Clock className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              No credit card required. Free for families.
            </p>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
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
                <div className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="col-span-2">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold">Today&apos;s Schedule</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { time: "9:00 AM", event: "Team Standup", color: "bg-blue-500" },
                            { time: "3:00 PM", event: "School Pickup", color: "bg-green-500" },
                            { time: "5:00 PM", event: "Soccer Practice", color: "bg-orange-500" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${item.color}`} />
                              <span className="text-sm text-muted-foreground w-20">{item.time}</span>
                              <span className="text-sm font-medium">{item.event}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckSquare className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">Tasks</span>
                        </div>
                        <div className="space-y-2">
                          {["Groceries", "Homework", "Laundry"].map((task, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border-2 border-muted-foreground/30" />
                              <span className="text-sm">{task}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
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
              Get Cozy in Minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple setup, powerful results. Here&apos;s how it works.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
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
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-muted-foreground/30" />
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
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
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
            className="text-center bg-gradient-to-br from-primary to-green-600 rounded-3xl p-12 text-primary-foreground"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Bird className="h-12 w-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Find Your Cozy?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join the thousands of families who&apos;ve made {brand.name} their home base.
              Start your free trial today.
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/onboarding">
                Build Your Nest
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-green-600 text-primary-foreground">
                  <Bird className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg">{brand.name}</span>
              </div>
              <p className="text-muted-foreground max-w-sm">
                {brand.story.long}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Updates</Link></li>
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
          <div className="border-t mt-12 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
