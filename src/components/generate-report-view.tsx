'use client';

/**
 * Generate Report View
 * 
 * Admin UI for manually entering report values and generating a PDF.
 * Left side: Form inputs for all report fields
 * Right side: Live PDF preview using @react-pdf/renderer
 */

import React, { useState, useMemo } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Plus, Trash2, Download, FileText } from 'lucide-react';
import { LeagueReportPDF } from './league-report-pdf';
import {
    createDefaultReportData,
    TEAM_LOGOS,
    ACTIVITY_TYPES,
    type LeagueReportData,
    type LeagueReportActivity,
    type FinalStandingType,
} from '@/lib/services/league-report';

// ============================================================================
// Form Section Components
// ============================================================================

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-rfl-navy mb-3 pb-2 border-b">{title}</h3>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            {children}
        </div>
    );
}

function FormInput({
    value,
    onChange,
    type = 'text',
    placeholder,
    min,
    step,
}: {
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    min?: number;
    step?: number;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            min={min}
            step={step}
            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rfl-navy/20"
        />
    );
}

function FormSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rfl-navy/20 bg-white"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function GenerateReportView() {
    const [data, setData] = useState<LeagueReportData>(createDefaultReportData);
    const [showPreview, setShowPreview] = useState(true);

    // Helper to update nested data
    const updateData = <K extends keyof LeagueReportData>(
        key: K,
        value: LeagueReportData[K]
    ) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const updateUser = (field: keyof LeagueReportData['user'], value: string) => {
        setData((prev) => ({
            ...prev,
            user: { ...prev.user, [field]: value },
        }));
    };

    const updateTeam = (field: keyof NonNullable<LeagueReportData['team']>, value: string | null) => {
        setData((prev) => ({
            ...prev,
            team: prev.team ? { ...prev.team, [field]: value } : { id: '', name: '', logoUrl: value },
        }));
    };

    const updatePerformance = (field: keyof LeagueReportData['performance'], value: number) => {
        setData((prev) => ({
            ...prev,
            performance: { ...prev.performance, [field]: value },
        }));
    };

    const updateRestDays = (field: keyof LeagueReportData['restDays'], value: number | string[]) => {
        setData((prev) => ({
            ...prev,
            restDays: { ...prev.restDays, [field]: value },
        }));
    };

    // Activity management
    const addActivity = () => {
        const newActivity: LeagueReportActivity = {
            activityName: 'Badminton/Pickleball',
            sessionCount: 1,
            totalDuration: null,
            totalDistance: null,
            totalSteps: null,
            totalHoles: null,
        };
        setData((prev) => ({
            ...prev,
            activities: [...prev.activities, newActivity],
        }));
    };

    const updateActivity = (index: number, field: keyof LeagueReportActivity, value: string | number | null) => {
        setData((prev) => ({
            ...prev,
            activities: prev.activities.map((a, i) =>
                i === index ? { ...a, [field]: value } : a
            ),
        }));
    };

    const removeActivity = (index: number) => {
        setData((prev) => ({
            ...prev,
            activities: prev.activities.filter((_, i) => i !== index),
        }));
    };

    // Generate filename
    const filename = useMemo(() => {
        const name = data.user.username || 'user';
        return `${name.replace(/\s+/g, '_')}_pfl_summary.pdf`;
    }, [data.user.username]);

    // Team logo options for select
    const teamLogoOptions = [
        { value: '', label: 'Select Team Logo...' },
        ...TEAM_LOGOS.map((t) => ({ value: t.logoPath, label: t.name })),
    ];

    // Final standing options
    const finalStandingOptions = [
        { value: 'top_10', label: 'Top 10th Percentile' },
        { value: 'top_50', label: 'Top 50th Percentile' },
        { value: 'completed', label: 'Completed (fallback)' },
    ];

    // Check if activity is steps-based
    const isStepsActivity = (name: string) => name.toLowerCase() === 'steps';

    return (
        <div className="flex h-[calc(100vh-120px)] gap-4">
            {/* Left Side: Form */}
            <div className="w-[420px] flex-shrink-0 overflow-y-auto bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-rfl-navy flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Generate Report
                    </h2>
                    <PDFDownloadLink
                        document={<LeagueReportPDF data={data} />}
                        fileName={filename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-rfl-navy text-white hover:opacity-90"
                    >
                        {({ loading }) => (
                            <>
                                <Download className="w-4 h-4" />
                                {loading ? 'Preparing...' : 'Download PDF'}
                            </>
                        )}
                    </PDFDownloadLink>
                </div>

                {/* User Info */}
                <FormSection title="User Information">
                    <FormRow label="Username (Display Name)">
                        <FormInput
                            value={data.user.username}
                            onChange={(v) => updateUser('username', v)}
                            placeholder="e.g. Akshay Rao"
                        />
                    </FormRow>
                </FormSection>

                {/* Team Info */}
                <FormSection title="Team Information">
                    <FormRow label="Team Name">
                        <FormInput
                            value={data.team?.name || ''}
                            onChange={(v) => updateTeam('name', v)}
                            placeholder="e.g. Pro League Team 1"
                        />
                    </FormRow>
                    <FormRow label="Team Logo">
                        <FormSelect
                            value={data.team?.logoUrl || ''}
                            onChange={(v) => updateTeam('logoUrl', v || null)}
                            options={teamLogoOptions}
                        />
                    </FormRow>
                </FormSection>

                {/* Points & Stats */}
                <FormSection title="Points & Stats">
                    <div className="grid grid-cols-2 gap-2">
                        <FormRow label="Total Points">
                            <FormInput
                                type="number"
                                value={data.finalIndividualScore}
                                onChange={(v) => updateData('finalIndividualScore', parseInt(v) || 0)}
                                min={0}
                            />
                        </FormRow>
                        <FormRow label="Avg RR">
                            <FormInput
                                type="number"
                                value={data.averageRR}
                                onChange={(v) => updateData('averageRR', parseFloat(v) || 0)}
                                min={0}
                                step={0.01}
                            />
                        </FormRow>
                    </div>
                </FormSection>

                {/* Performance */}
                <FormSection title="Performance Overview">
                    <div className="grid grid-cols-2 gap-2">
                        <FormRow label="Workouts Completed">
                            <FormInput
                                type="number"
                                value={data.performance.totalActivities}
                                onChange={(v) => updatePerformance('totalActivities', parseInt(v) || 0)}
                                min={0}
                            />
                        </FormRow>
                        <FormRow label="Rest Days Taken">
                            <FormInput
                                type="number"
                                value={data.restDays.total}
                                onChange={(v) => updateRestDays('total', parseInt(v) || 0)}
                                min={0}
                            />
                        </FormRow>
                        <FormRow label="Active Days">
                            <FormInput
                                type="number"
                                value={data.performance.totalActiveDays}
                                onChange={(v) => updatePerformance('totalActiveDays', parseInt(v) || 0)}
                                min={0}
                            />
                        </FormRow>
                        <FormRow label="Missed Days">
                            <FormInput
                                type="number"
                                value={data.performance.totalMissedDays}
                                onChange={(v) => updatePerformance('totalMissedDays', parseInt(v) || 0)}
                                min={0}
                            />
                        </FormRow>
                        <FormRow label="Best Streak (Days)">
                            <FormInput
                                type="number"
                                value={data.performance.bestStreak}
                                onChange={(v) => updatePerformance('bestStreak', parseInt(v) || 0)}
                                min={0}
                            />
                        </FormRow>
                    </div>
                </FormSection>

                {/* Individual Standing */}
                <FormSection title="Individual Standing">
                    <FormRow label="Standing">
                        <FormSelect
                            value={data.finalStanding}
                            onChange={(v) => updateData('finalStanding', v as FinalStandingType)}
                            options={finalStandingOptions}
                        />
                    </FormRow>
                </FormSection>

                {/* Activities */}
                <FormSection title="Activities">
                    {data.activities.map((activity, idx) => (
                        <div key={idx} className="border rounded p-2 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">Activity {idx + 1}</span>
                                <button
                                    onClick={() => removeActivity(idx)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                    title="Remove"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <FormRow label="Name">
                                    <FormSelect
                                        value={activity.activityName}
                                        onChange={(v) => updateActivity(idx, 'activityName', v)}
                                        options={ACTIVITY_TYPES.map((t) => ({ value: t, label: t }))}
                                    />
                                </FormRow>
                                <FormRow label="Sessions">
                                    <FormInput
                                        type="number"
                                        value={activity.sessionCount}
                                        onChange={(v) => updateActivity(idx, 'sessionCount', parseInt(v) || 0)}
                                        min={0}
                                    />
                                </FormRow>
                                {isStepsActivity(activity.activityName) ? (
                                    <FormRow label="Steps">
                                        <FormInput
                                            type="number"
                                            value={activity.totalSteps || ''}
                                            onChange={(v) => updateActivity(idx, 'totalSteps', v ? parseInt(v) : null)}
                                            min={0}
                                        />
                                    </FormRow>
                                ) : (
                                    <>
                                        <FormRow label="Duration (mins)">
                                            <FormInput
                                                type="number"
                                                value={activity.totalDuration || ''}
                                                onChange={(v) => updateActivity(idx, 'totalDuration', v ? parseInt(v) : null)}
                                                min={0}
                                            />
                                        </FormRow>
                                        <FormRow label="Distance (km)">
                                            <FormInput
                                                type="number"
                                                value={activity.totalDistance || ''}
                                                onChange={(v) => updateActivity(idx, 'totalDistance', v ? parseFloat(v) : null)}
                                                min={0}
                                                step={0.1}
                                            />
                                        </FormRow>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addActivity}
                        className="w-full py-2 border-2 border-dashed rounded text-sm text-gray-500 hover:border-rfl-navy hover:text-rfl-navy flex items-center justify-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Add Activity
                    </button>
                </FormSection>

                {/* Generated At */}
                <FormSection title="Report Meta">
                    <FormRow label="Generated At">
                        <FormInput
                            type="date"
                            value={data.generatedAt.split('T')[0]}
                            onChange={(v) => updateData('generatedAt', new Date(v).toISOString())}
                        />
                    </FormRow>
                </FormSection>
            </div>

            {/* Right Side: PDF Preview */}
            <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                </div>
                {showPreview && (
                    <div className="flex-1">
                        <PDFViewer width="100%" height="100%" showToolbar={false}>
                            <LeagueReportPDF data={data} />
                        </PDFViewer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GenerateReportView;
