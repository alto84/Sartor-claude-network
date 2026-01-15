"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Bell,
  Shield,
  Palette,
  Home,
  Link,
  Save,
  Camera,
} from "lucide-react";

function ProfileSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              AS
            </AvatarFallback>
          </Avatar>
          <Button variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Change Photo
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" defaultValue="Alton" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" defaultValue="Sartor" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="alton@sartor.family" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
          </div>
        </div>

        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    calendar: true,
    tasks: true,
    home: false,
    dailyDigest: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to be notified about updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {[
            {
              key: "email" as const,
              title: "Email Notifications",
              description: "Receive updates via email",
            },
            {
              key: "push" as const,
              title: "Push Notifications",
              description: "Receive push notifications on your devices",
            },
            {
              key: "calendar" as const,
              title: "Calendar Reminders",
              description: "Get reminded about upcoming events",
            },
            {
              key: "tasks" as const,
              title: "Task Reminders",
              description: "Get reminded about due tasks",
            },
            {
              key: "home" as const,
              title: "Smart Home Alerts",
              description: "Receive alerts for home automation events",
            },
            {
              key: "dailyDigest" as const,
              title: "Daily Digest",
              description: "Get a daily summary of activities",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Button
                variant={notifications[item.key] ? "default" : "outline"}
                size="sm"
                onClick={() => toggleNotification(item.key)}
              >
                {notifications[item.key] ? "On" : "Off"}
              </Button>
            </div>
          ))}
        </div>

        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}

function PrivacySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy & Security</CardTitle>
        <CardDescription>
          Manage your privacy settings and security options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
        </div>

        <Button>Update Password</Button>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
          <Button variant="outline">Enable 2FA</Button>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium">Session Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage active sessions across devices
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-muted-foreground">
                  Windows - Chrome - Active now
                </p>
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-white border" />
                <span className="text-xs">Light</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 border" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white to-gray-900 border" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Accent Color</h3>
            <div className="flex gap-3">
              {[
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
                "bg-orange-500",
                "bg-pink-500",
                "bg-teal-500",
              ].map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full ${color} ring-2 ring-offset-2 ring-transparent hover:ring-gray-400 transition-all`}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Font Size</h3>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Small
              </Button>
              <Button variant="default" size="sm">
                Medium
              </Button>
              <Button variant="outline" size="sm">
                Large
              </Button>
            </div>
          </div>
        </div>

        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Appearance
        </Button>
      </CardContent>
    </Card>
  );
}

function IntegrationSettings() {
  const integrations = [
    {
      name: "Google Calendar",
      description: "Sync your Google Calendar events",
      connected: true,
      icon: "G",
    },
    {
      name: "Smart Home (Home Assistant)",
      description: "Control your home devices",
      connected: true,
      icon: "HA",
    },
    {
      name: "Email (Gmail)",
      description: "Access your email inbox",
      connected: false,
      icon: "M",
    },
    {
      name: "Obsidian Vault",
      description: "Access your knowledge base",
      connected: true,
      icon: "O",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect external services to enhance your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-sm">
                {integration.icon}
              </div>
              <div>
                <p className="font-medium">{integration.name}</p>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            </div>
            <Button variant={integration.connected ? "outline" : "default"}>
              {integration.connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HomeSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Home Settings</CardTitle>
        <CardDescription>
          Configure your smart home integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="haUrl">Home Assistant URL</Label>
            <Input
              id="haUrl"
              placeholder="http://homeassistant.local:8123"
              defaultValue="http://192.168.1.100:8123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="haToken">Access Token</Label>
            <Input
              id="haToken"
              type="password"
              placeholder="Long-lived access token"
              defaultValue="••••••••••••••••"
            />
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium">Quick Scenes</h3>
          <p className="text-sm text-muted-foreground">
            Configure scenes available in quick actions
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Morning Routine", "Good Night", "Movie Time", "Away Mode"].map(
              (scene) => (
                <div
                  key={scene}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm font-medium">{scene}</span>
                  <Button variant="ghost" size="sm">
                    Configure
                  </Button>
                </div>
              )
            )}
          </div>
        </div>

        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="home" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Smart Home</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationSettings />
        </TabsContent>

        <TabsContent value="home">
          <HomeSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
