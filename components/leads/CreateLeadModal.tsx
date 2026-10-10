"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  UserPlus,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { leadService } from "@/services/lead.service";
import { getWorkspaceUsers } from "@/services/user.service";
import type { CreateLeadDto, Lead } from "@/types/lead";
import type { WorkspaceUser } from "@/types/user";

export interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: Lead) => void;
}

const COMMON_INDUSTRIES = [
  "Technology & Software",
  "Financial Services",
  "E-Commerce & Retail",
  "Healthcare & Life Sciences",
  "Manufacturing & Logistics",
  "Telecommunications",
  "Education & EdTech",
  "Consulting & Professional Services",
];

function CreateLeadForm({
  onClose,
  onSuccess,
  sources,
  users,
  isSourcesLoading,
}: {
  onClose: () => void;
  onSuccess?: (lead: Lead) => void;
  sources: { id: string; name: string }[];
  users: WorkspaceUser[];
  isSourcesLoading: boolean;
}) {
  const queryClient = useQueryClient();

  // Form State
  const [formData, setFormData] = React.useState<CreateLeadDto>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    companyWebsite: "",
    jobTitle: "",
    companySize: undefined,
    industry: "",
    sourceId: sources[0]?.id || "",
    ownerId: undefined,
    notes: "",
  }));

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successLead, setSuccessLead] = React.useState<Lead | null>(null);

  // Auto-select first available source when sources are loaded
  React.useEffect(() => {
    if (!formData.sourceId && sources.length > 0) {
      setFormData((prev) => ({ ...prev, sourceId: sources[0].id }));
    }
  }, [sources, formData.sourceId]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (dto: CreateLeadDto) => leadService.createLead(dto),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSuccessLead(lead);
      if (onSuccess) onSuccess(lead);
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const message =
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        "Failed to create lead. Please check the form data.";
      setServerError(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errs.firstName = "First name is required";
    }

    if (!formData.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!formData.companyName?.trim()) {
      errs.companyName = "Company name is required";
    }

    const effectiveSourceId = formData.sourceId || sources[0]?.id;
    if (!effectiveSourceId) {
      errs.sourceId = "Lead acquisition source is required";
    }

    if (formData.phone && !/^[0-9+\s().-]{7,25}$/.test(formData.phone)) {
      errs.phone = "Invalid phone number format";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    const effectiveSourceId = formData.sourceId || sources[0]?.id || "";

    const payload: CreateLeadDto = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName?.trim() || undefined,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || undefined,
      companyName: formData.companyName?.trim() || undefined,
      companyWebsite: formData.companyWebsite?.trim() || undefined,
      jobTitle: formData.jobTitle?.trim() || undefined,
      companySize: formData.companySize ? Number(formData.companySize) : undefined,
      industry: formData.industry || undefined,
      sourceId: effectiveSourceId,
      ownerId: formData.ownerId || undefined,
      notes: formData.notes?.trim() || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
            <UserPlus className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Create New Lead
            </h3>
            <p className="text-xs text-gray-500">
              UC01 Lead Intake &amp; Real-time AI Pipeline Ingestion
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="size-8 p-0 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Modal Body */}
      <div className="p-6 overflow-y-auto space-y-5">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800 animate-in fade-in">
            <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Creation Error</span>
              <p>{serverError}</p>
            </div>
          </div>
        )}

        {successLead ? (
          <div className="space-y-5 py-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-gray-900">
                Lead Created Successfully!
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                <span className="font-semibold text-gray-800">
                  {successLead.firstName} {successLead.lastName}
                </span>{" "}
                from{" "}
                <span className="font-semibold text-gray-800">
                  {successLead.companyName}
                </span>{" "}
                has been added to the active CRM intake pipeline.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccessLead(null);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    companyName: "",
                    companyWebsite: "",
                    jobTitle: "",
                    companySize: undefined,
                    industry: "",
                    sourceId: sources[0]?.id || "",
                    ownerId: undefined,
                    notes: "",
                  });
                }}
                className="text-xs"
              >
                Create Another Lead
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                View in Pipeline
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Contact Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. John"
                  value={formData.firstName}
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
                <Label htmlFor="lastName" className="text-xs font-semibold text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={errors.email ? "border-red-500 pl-8" : "pl-8"}
                  />
                  <Mail className="size-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
                {errors.email && (
                  <span className="text-[11px] text-red-600">{errors.email}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-1234"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={errors.phone ? "border-red-500 pl-8" : "pl-8"}
                  />
                  <Phone className="size-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
                {errors.phone && (
                  <span className="text-[11px] text-red-600">{errors.phone}</span>
                )}
              </div>
            </div>

            {/* Row 3: Company & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-semibold text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="companyName"
                    placeholder="e.g. Acme Corporation"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className={errors.companyName ? "border-red-500 pl-8" : "pl-8"}
                  />
                  <Building2 className="size-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
                {errors.companyName && (
                  <span className="text-[11px] text-red-600">{errors.companyName}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyWebsite" className="text-xs font-semibold text-gray-700">
                  Company Website
                </Label>
                <div className="relative">
                  <Input
                    id="companyWebsite"
                    type="url"
                    placeholder="https://acme.com"
                    value={formData.companyWebsite}
                    onChange={(e) =>
                      setFormData({ ...formData, companyWebsite: e.target.value })
                    }
                    className="pl-8"
                  />
                  <Globe className="size-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Row 4: Job Title & Industry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle" className="text-xs font-semibold text-gray-700">
                  Job Title / Role
                </Label>
                <div className="relative">
                  <Input
                    id="jobTitle"
                    placeholder="e.g. VP Engineering"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    className="pl-8"
                  />
                  <Briefcase className="size-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companySize" className="text-xs font-semibold text-gray-700">
                  Employee Size
                </Label>
                <div className="relative">
                  <Input
                    id="companySize"
                    type="number"
                    min={1}
                    placeholder="e.g. 150"
                    value={formData.companySize ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        companySize: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="pl-8"
                  />
                  <Users className="size-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="industry" className="text-xs font-semibold text-gray-700">
                  Industry
                </Label>
                <Select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                >
                  <option value="">Select Industry</option>
                  {COMMON_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Row 5: Source & Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sourceId" className="text-xs font-semibold text-gray-700">
                  Acquisition Source <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="sourceId"
                  value={formData.sourceId || sources[0]?.id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceId: e.target.value })
                  }
                  className={errors.sourceId ? "border-red-500" : ""}
                >
                  {isSourcesLoading ? (
                    <option value="">Loading sources...</option>
                  ) : sources.length === 0 ? (
                    <option value="direct-website">Direct Inbound (Default)</option>
                  ) : (
                    sources.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name}
                      </option>
                    ))
                  )}
                </Select>
                {errors.sourceId && (
                  <span className="text-[11px] text-red-600">{errors.sourceId}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ownerId" className="text-xs font-semibold text-gray-700">
                  Sales Assignee / Owner
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
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role || "MEMBER"})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Row 6: Internal Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-gray-700">
                Initial Notes / Customer Remarks
              </Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Notes about prospective project, timeline, budget expectations..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="text-xs"
              />
            </div>

            {/* Submit Buttons */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={createMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm gap-1.5"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Creating Lead...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3.5" />
                    Save &amp; Ingest Lead
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function CreateLeadModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateLeadModalProps) {
  // Fetch Lead Sources
  const { data: sources = [], isLoading: isSourcesLoading } = useQuery({
    queryKey: ["lead-sources"],
    queryFn: () => leadService.getLeadSources(),
    enabled: isOpen,
  });

  // Fetch Workspace Users (Owners)
  const { data: users = [] } = useQuery({
    queryKey: ["workspace-users"],
    queryFn: () => getWorkspaceUsers(),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <CreateLeadForm
        onClose={onClose}
        onSuccess={onSuccess}
        sources={sources}
        users={users}
        isSourcesLoading={isSourcesLoading}
      />
    </div>
  );
}
