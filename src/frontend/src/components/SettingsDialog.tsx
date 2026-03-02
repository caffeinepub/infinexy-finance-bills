import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useGetProfile, useUpdateProfile } from "../hooks/useQueries";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const defaultProfile: UserProfile = {
  companyName: "Infinexy Finance",
  gstin: "",
  pan: "",
  mobile: "",
  email: "",
  website: "",
};

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { data: profile } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    if (profile) {
      setForm(profile);
    }
  }, [profile]);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(form);
      toast.success("Company profile updated successfully");
      onClose();
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">
            Company Profile Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            This information will appear on all invoices and expense vouchers.
          </p>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Infinexy Finance"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={form.gstin}
                  onChange={(e) => handleChange("gstin", e.target.value)}
                  placeholder="24XXXXX..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={form.pan}
                  onChange={(e) => handleChange("pan", e.target.value)}
                  placeholder="XXXXX0000X"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={form.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="info@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="www.company.com"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="bg-navy hover:bg-navy-light text-white"
          >
            {updateProfile.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
