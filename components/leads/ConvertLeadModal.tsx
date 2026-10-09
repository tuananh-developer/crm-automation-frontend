"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { leadService } from "@/services/lead.service";
import { getWorkspaceUsers } from "@/services/user.service";
import type { ConvertLeadResult, Lead } from "@/types/lead";
import type { WorkspaceUser } from "@/types/user";

export interface ConvertLeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: ConvertLeadResult) => void;
}

function ConvertLeadDialog({
  lead,
  onClose,
  onSuccess,
  users,
  isUsersLoading,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess?: (result: ConvertLeadResult) => void;
  users: WorkspaceUser[];
  isUsersLoading: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedUserId, setSelectedUserId] = React.useState<string>(
    () => lead.ownerId || users[0]?.id || "",
  );
  const [conversionResult, setConversionResult] =
    React.useState<ConvertLeadResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Conversion Mutation
  const convertMutation = useMutation({
    mutationFn: () => {
      const activeUserId = selectedUserId || lead.ownerId || users[0]?.id;
      if (!activeUserId) throw new Error("Please select an operating user.");
      return leadService.convertLead(lead.id, { userId: activeUserId });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setConversionResult(result);
      if (onSuccess) onSuccess(result);
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        "Conversion failed. Only QUALIFIED leads can be converted.";
      setErrorMessage(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  return (
    <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-white">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm shadow-emerald-700/20">
            <UserCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Convert Lead to Customer (UC08)
            </h3>
            <p className="text-xs text-gray-500">
              Transition verified prospect into permanent customer account
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

      {/* Content */}
      <div className="p-6 space-y-5">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-in fade-in">
            <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Conversion Blocked: </span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {conversionResult ? (
          <div className="space-y-5 py-4 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-gray-900">
                {conversionResult.customerCreated
                  ? "Customer Successfully Created!"
                  : "Matched to Existing Customer!"}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {conversionResult.message ||
                  `Lead has been converted into customer '${conversionResult.customer.name}'.`}
              </p>
              {conversionResult.matchedBy && (
                <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 mt-1">
                  Duplicate prevention matched by {conversionResult.matchedBy}
                </span>
              )}
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Stay on Lead
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  router.push(`/customers/${conversionResult.customer.id}`);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-1.5 shadow-sm"
              >
                Open Customer Profile
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Target Lead Summary Card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Target Prospect
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {lead.status}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900">
                  {lead.firstName} {lead.lastName}
                </h4>
                <div className="flex flex-col gap-1 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-gray-400" />
                    {lead.companyName || "No Company"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-gray-400" />
                    {lead.email}
                  </span>
                  {lead.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-gray-400" />
                      {lead.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Conversion Rules Note */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
              <ShieldCheck className="size-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                PostgreSQL advisory locking ensures idempotency. If a customer with matching email already exists, this lead will safely associate with the existing record without generating duplicates.
              </p>
            </div>

            {/* Operating User Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="convertingUser" className="text-xs font-semibold text-gray-700">
                Converting User / Responsible Rep <span className="text-red-500">*</span>
              </Label>
              <Select
                id="convertingUser"
                value={selectedUserId || users[0]?.id || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {isUsersLoading ? (
                  <option value="">Loading workspace users...</option>
                ) : users.length === 0 ? (
                  <option value="">No users found</option>
                ) : (
                  users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role || "SALES"})
                    </option>
                  ))
                )}
              </Select>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={convertMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending || (!selectedUserId && users.length === 0)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm gap-1.5"
              >
                {convertMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Converting Lead...
                  </>
                ) : (
                  <>
                    <UserCheck className="size-3.5" />
                    Confirm &amp; Convert
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConvertLeadModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: ConvertLeadModalProps) {
  // Fetch workspace sales users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["workspace-users"],
    queryFn: () => getWorkspaceUsers(),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <ConvertLeadDialog
        lead={lead}
        onClose={onClose}
        onSuccess={onSuccess}
        users={users}
        isUsersLoading={isUsersLoading}
      />
    </div>
  );
}
