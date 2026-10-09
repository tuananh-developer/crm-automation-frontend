"use client";

import * as React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  X,
  Edit3,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { leadService } from "@/services/lead.service";
import { getWorkspaceUsers } from "@/services/user.service";
import type { Lead, LeadStatus, UpdateLeadDto } from "@/types/lead";
import type { WorkspaceUser } from "@/types/user";

export interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedLead: Lead) => void;
}

const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "New Lead (Intake)" },
  { value: "QUALIFYING", label: "Qualifying (In Progress)" },
  { value: "QUALIFIED", label: "Qualified (Sales Ready)" },
  { value: "CONTACTED", label: "Contacted (Outreach Started)" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "CONVERTED", label: "Converted to Customer" },
  { value: "LOST", label: "Lost / Closed" },
];

function EditLeadForm({
  lead,
  onClose,
  onSuccess,
  users,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess?: (updatedLead: Lead) => void;
  users: WorkspaceUser[];
}) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState<UpdateLeadDto>(() => ({
    firstName: lead.firstName,
    lastName: lead.lastName || "",
    email: lead.email,
    phone: lead.phone || "",
    companyName: lead.companyName,
    companyWebsite: lead.companyWebsite || "",
    jobTitle: lead.jobTitle || "",
    companySize: lead.companySize || undefined,
    industry: lead.industry || "",
    status: lead.status,
    ownerId: lead.ownerId || undefined,
    notes: lead.notes || "",
  }));

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (dto: UpdateLeadDto) => leadService.updateLead(lead.id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", lead.id] });
      if (onSuccess) onSuccess(updated);
      onClose();
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        "Failed to update lead details.";
      setServerError(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      errs.firstName = "First name is required";
    }

    if (!formData.email?.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Invalid email format";
    }

    if (!formData.companyName?.trim()) {
      errs.companyName = "Company name is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    updateMutation.mutate({
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim() || undefined,
      email: formData.email?.trim().toLowerCase(),
      phone: formData.phone?.trim() || undefined,
      companyName: formData.companyName?.trim(),
      companyWebsite: formData.companyWebsite?.trim() || undefined,
      jobTitle: formData.jobTitle?.trim() || undefined,
      companySize: formData.companySize ? Number(formData.companySize) : undefined,
      industry: formData.industry || undefined,
      status: formData.status,
      ownerId: formData.ownerId || null,
      notes: formData.notes?.trim() || undefined,
    });
  };

  return (
    <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/70">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
            <Edit3 className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Edit Lead: {lead.firstName} {lead.lastName}
            </h3>
            <p className="text-xs text-gray-500">
              Update status, owner assignment, and verified firmographics
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="size-8 p-0 rounded-full text-gray-400 hover:text-gray-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto space-y-4">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Error: </span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Status & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-emerald-50/30 p-3.5 border border-emerald-100/70">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-bold text-emerald-900">
                Lead Pipeline Status
              </Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as LeadStatus,
                  })
                }
                className="bg-white font-medium"
              >
                {LEAD_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ownerId" className="text-xs font-bold text-emerald-900">
                Sales Owner
              </Label>
              <Select
                id="ownerId"
                value={formData.ownerId ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownerId: e.target.value || undefined,
                  })
                }
                className="bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Row 2: Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editFirstName" className="text-xs font-semibold text-gray-700">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editFirstName"
                value={formData.firstName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <span className="text-[11px] text-red-600">{errors.firstName}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editLastName" className="text-xs font-semibold text-gray-700">
                Last Name
              </Label>
              <Input
                id="editLastName"
                value={formData.lastName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Row 3: Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editEmail" className="text-xs font-semibold text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <span className="text-[11px] text-red-600">{errors.email}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editPhone" className="text-xs font-semibold text-gray-700">
                Phone Number
              </Label>
              <Input
                id="editPhone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          {/* Row 4: Company Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editCompanyName" className="text-xs font-semibold text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editCompanyName"
                value={formData.companyName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className={errors.companyName ? "border-red-500" : ""}
              />
              {errors.companyName && (
                <span className="text-[11px] text-red-600">{errors.companyName}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editCompanyWebsite" className="text-xs font-semibold text-gray-700">
                Company Website
              </Label>
              <Input
                id="editCompanyWebsite"
                type="url"
                value={formData.companyWebsite || ""}
                onChange={(e) =>
                  setFormData({ ...formData, companyWebsite: e.target.value })
                }
              />
            </div>
          </div>

          {/* Row 5: Role & Company Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editJobTitle" className="text-xs font-semibold text-gray-700">
                Job Title
              </Label>
              <Input
                id="editJobTitle"
                value={formData.jobTitle || ""}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editCompanySize" className="text-xs font-semibold text-gray-700">
                Employees
              </Label>
              <Input
                id="editCompanySize"
                type="number"
                min={1}
                value={formData.companySize ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companySize: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editIndustry" className="text-xs font-semibold text-gray-700">
                Industry
              </Label>
              <Input
                id="editIndustry"
                value={formData.industry || ""}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="editNotes" className="text-xs font-semibold text-gray-700">
              Internal Notes
            </Label>
            <Textarea
              id="editNotes"
              rows={2}
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm gap-1.5"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit3 className="size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditLeadModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: EditLeadModalProps) {
  // Fetch Workspace Users
  const { data: users = [] } = useQuery({
    queryKey: ["workspace-users"],
    queryFn: () => getWorkspaceUsers(),
    enabled: isOpen,
  });

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <EditLeadForm
        key={lead.id}
        lead={lead}
        onClose={onClose}
        onSuccess={onSuccess}
        users={users}
      />
    </div>
  );
}
