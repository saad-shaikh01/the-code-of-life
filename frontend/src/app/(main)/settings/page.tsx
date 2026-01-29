"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, User, Lock, Palette, Bell, Trash2, Moon, Sun, Monitor } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useTheme } from "@/modules/theme/contexts/theme-provider";
import { usersService, authService } from "@/api";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  // Profile form
  const [username, setUsername] = React.useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const response = await usersService.updateProfile({
        username: username !== user?.username ? username : undefined,
        avatarUrl: avatarUrl !== user?.avatarUrl ? avatarUrl : undefined,
      });
      setUser(response.data);
      addToast({
        type: "success",
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast({
        type: "error",
        title: "Passwords Don't Match",
        description: "New password and confirmation must match.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      addToast({
        type: "success",
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      addToast({
        type: "error",
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "Failed to change password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) {
      addToast({
        type: "error",
        title: "Confirmation Failed",
        description: "Please type your username to confirm.",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await usersService.deleteAccount();
      logout();
      router.push("/");
      addToast({
        type: "success",
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete account.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <Settings className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Not Logged In</h2>
        <p className="text-muted-foreground">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto"
    >
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Profile Settings
            </CardTitle>
            <CardDescription>Update your display name and avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
            <Input
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <Button
              onClick={handleUpdateProfile}
              isLoading={isUpdatingProfile}
              disabled={username === user.username && avatarUrl === (user.avatarUrl || "")}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              Appearance
            </CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <Input
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <Button
              onClick={handleChangePassword}
              isLoading={isChangingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. All your progress,
              achievements, and data will be permanently removed.
            </p>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Type <span className="font-semibold text-foreground">{user.username}</span> to confirm:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={deleteConfirm !== user.username}
            >
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
