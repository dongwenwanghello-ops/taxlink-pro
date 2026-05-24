import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import {
  QUALIFICATION_STATUS,
  QUALIFICATION_STATUS_OPTIONS,
  QUALIFICATION_BODIES,
  PROFESSIONAL_BACKGROUND_OPTIONS,
} from "@/lib/professionalProfileModel";
import { TOP_QUALIFICATIONS, MORE_QUALIFICATIONS } from "@/lib/onboardingUX";

const FULLY_QUAL_BODIES = ["ACCA", "ATT", "CTA", "ICAEW", "ACA", "AAT"];

export default function QualificationSection({ form, setForm, showMoreQualifications, onToggleShowMore }) {
  const status = form.qualification_status;
  const visibleBodies = showMoreQualifications
    ? [...new Set([...FULLY_QUAL_BODIES, ...TOP_QUALIFICATIONS, ...MORE_QUALIFICATIONS])]
    : FULLY_QUAL_BODIES;

  const setField = (key, value) => setForm({ ...form, [key]: value });

  const toggleFullyQualified = (body) => {
    const has = form.qualifications.includes(body);
    const next = has ? form.qualifications.filter((q) => q !== body) : [...form.qualifications, body];
    setForm({
      ...form,
      qualifications: next,
      qualification_body: next[0] || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Qualification status</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {QUALIFICATION_STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-colors text-sm ${
                status === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <input
                type="radio"
                name="qualification_status"
                checked={status === opt.value}
                onChange={() =>
                  setForm({
                    ...form,
                    qualification_status: opt.value,
                    qualifications: opt.value === QUALIFICATION_STATUS.FULLY_QUALIFIED ? form.qualifications : [],
                  })
                }
                className="accent-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {status === QUALIFICATION_STATUS.FULLY_QUALIFIED && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="space-y-2">
            <Label>Qualification</Label>
            <div className="flex flex-wrap gap-2">
              {visibleBodies.map((q) => (
                <Badge
                  key={q}
                  variant={form.qualifications.includes(q) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3 select-none"
                  onClick={() => toggleFullyQualified(q)}
                >
                  {q}
                  {form.qualifications.includes(q) && <X className="h-3 w-3 ml-1.5" />}
                </Badge>
              ))}
            </div>
            <button
              type="button"
              onClick={onToggleShowMore}
              className="text-xs font-semibold text-primary"
            >
              {showMoreQualifications ? "Show fewer bodies" : "More qualification bodies"}
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qual_year">Year obtained (optional)</Label>
            <Input
              id="qual_year"
              placeholder="e.g. 2019"
              maxLength={4}
              value={form.qualification_year_obtained}
              onChange={(e) => setField("qualification_year_obtained", e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
        </div>
      )}

      {status === QUALIFICATION_STATUS.PART_QUALIFIED && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="space-y-2">
            <Label>Qualification</Label>
            <Select value={form.qualification_body} onValueChange={(v) => setField("qualification_body", v)}>
              <SelectTrigger><SelectValue placeholder="Select body" /></SelectTrigger>
              <SelectContent>
                {QUALIFICATION_BODIES.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="papers">Papers completed (optional)</Label>
              <Input
                id="papers"
                placeholder="e.g. 9/13"
                value={form.qualification_progress_papers}
                onChange={(e) => setField("qualification_progress_papers", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pct">Or completion % (optional)</Label>
              <Input
                id="pct"
                placeholder="e.g. 70"
                value={form.qualification_progress_pct}
                onChange={(e) => setField("qualification_progress_pct", e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
            </div>
          </div>
        </div>
      )}

      {status === QUALIFICATION_STATUS.STUDYING && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="space-y-2">
            <Label>Qualification</Label>
            <Select value={form.qualification_body} onValueChange={(v) => setField("qualification_body", v)}>
              <SelectTrigger><SelectValue placeholder="e.g. CTA" /></SelectTrigger>
              <SelectContent>
                {QUALIFICATION_BODIES.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expected">Expected completion</Label>
            <Input
              id="expected"
              placeholder="e.g. 2027"
              maxLength={4}
              value={form.qualification_expected_completion}
              onChange={(e) => setField("qualification_expected_completion", e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
        </div>
      )}

      {status === QUALIFICATION_STATUS.QUALIFIED_BY_EXPERIENCE && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="space-y-2">
            <Label htmlFor="yrs_num">Years experience</Label>
            <Input
              id="yrs_num"
              type="number"
              min={1}
              max={50}
              placeholder="e.g. 8"
              value={form.years_experience_numeric}
              onChange={(e) => setField("years_experience_numeric", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prev_emp">Previous employer (optional)</Label>
            <Input
              id="prev_emp"
              placeholder="e.g. EY, HMRC, local practice"
              value={form.previous_employer}
              onChange={(e) => setField("previous_employer", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Professional background (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONAL_BACKGROUND_OPTIONS.map((bg) => (
                <Badge
                  key={bg}
                  variant={form.professional_background === bg ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3"
                  onClick={() =>
                    setField("professional_background", form.professional_background === bg ? "" : bg)
                  }
                >
                  {bg}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
