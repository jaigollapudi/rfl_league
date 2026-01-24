/**
 * League Report PDF Template - Single Page Version
 * 
 * Layout:
 * - Header with logos and title
 * - User info row
 * - Two columns: Performance Overview (left) | Individual Standing (right)
 * - Activity Details table with avg per session column
 */

import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    Svg,
    Path,
} from '@react-pdf/renderer';
import type { LeagueReportData } from '@/lib/services/league-report';

// ============================================================================
// Theme & Styles
// ============================================================================

const theme = {
    blueDark: '#1E3A8A',
    bluePrimary: '#2563EB',
    blueLight: '#EFF6FF',
    grayText: '#374151',
    grayLight: '#F3F4F6',
    grayMuted: '#9CA3AF',
    white: '#FFFFFF',
    accent: '#F59E0B',
    green: '#10B981',
    orange: '#F97316',
};

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        backgroundColor: theme.white,
        flexDirection: 'column',
    },
    // Header
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 4,
        borderBottomColor: theme.blueDark,
    },
    headerLogoBox: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    logoPlaceholder: {
        width: 55,
        height: 55,
        backgroundColor: theme.grayLight,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoPlaceholderText: {
        fontSize: 8,
        color: theme.grayText,
        fontWeight: 'bold',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    reportTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.blueDark,
    },
    reportSubtitle: {
        fontSize: 11,
        color: theme.grayMuted,
        marginTop: 4,
    },

    // User Info Row
    userInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.blueLight,
        padding: 14,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 5,
        borderLeftColor: theme.blueDark,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.blueDark,
    },
    teamName: {
        fontSize: 12,
        color: theme.bluePrimary,
        marginLeft: 8,
    },
    statsHighlight: {
        flexDirection: 'row',
        gap: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        color: theme.grayMuted,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.blueDark,
    },

    // Two Column Layout
    columnsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    column: {
        flex: 1,
    },

    // Section Styling
    section: {
        backgroundColor: theme.white,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.grayLight,
    },
    sectionHeader: {
        backgroundColor: theme.blueDark,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: theme.white,
        textTransform: 'uppercase',
    },
    sectionContent: {
        padding: 10,
    },

    // Metric Row
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: theme.grayLight,
    },
    metricRowLast: {
        borderBottomWidth: 0,
    },
    metricLabel: {
        fontSize: 11,
        color: theme.grayText,
    },
    metricValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: theme.blueDark,
    },

    // Final Standing
    finalStandingContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    trophyCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    finalRankText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.blueDark,
        textAlign: 'center',
    },
    finalPointsText: {
        fontSize: 9,
        color: theme.grayMuted,
        marginTop: 3,
    },

    // Footer
    footer: {
        textAlign: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.grayLight,
        marginTop: 'auto',
    },
    footerText: {
        fontSize: 9,
        color: theme.grayMuted,
    },

    // Table styles
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: theme.blueDark,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    tableHeaderCell: {
        color: theme.white,
        fontSize: 9,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.grayLight,
    },
    tableRowAlt: {
        backgroundColor: theme.blueLight,
    },
    tableCell: {
        fontSize: 9,
        color: theme.grayText,
    },
    tableCellBold: {
        fontSize: 9,
        fontWeight: 'bold',
        color: theme.blueDark,
    },

    brandText: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: theme.blueDark,
        letterSpacing: 1.5,
        marginTop: 6,
        marginBottom: 4,
    },
    
    // Activity Details section title
    activityTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.blueDark,
        marginBottom: 10,
    },
});

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDuration(minutes: number | null): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

function formatAvgDuration(totalMinutes: number | null, sessions: number): string {
    if (!totalMinutes || sessions === 0) return '-';
    const avg = totalMinutes / sessions;
    const mins = Math.round(avg);
    if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        const remainder = mins % 60;
        return `${hours}h ${remainder}m`;
    }
    return `${mins}m`;
}

// ============================================================================
// SVG Icons
// ============================================================================

const TrophyIcon = ({ size = 28 }: { size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
            fill="#FFFFFF"
            d="M20.2 2H3.8c-1.1 0-2 .9-2 2v3.5c0 1.9 1.5 3.5 3.4 3.5h.3c1 2.3 3.3 3.9 6 3.9s5-1.6 6-3.9h.3c1.9 0 3.4-1.6 3.4-3.5V4c0-1.1-.9-2-2-2z"
        />
        <Path fill="#FFFFFF" d="M10 16h4v2h-4zM7 19h10v3H7z" />
    </Svg>
);

// ============================================================================
// Component: Logo
// ============================================================================

const Logo = ({ src, placeholderText }: { src: string | null, placeholderText: string }) => (
    <View style={styles.headerLogoBox}>
        {src ? (
            <Image src={src} style={styles.logo} />
        ) : (
            <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>{placeholderText}</Text>
            </View>
        )}
    </View>
);

// ============================================================================
// Component: Section
// ============================================================================

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

// ============================================================================
// Component: MetricRow
// ============================================================================

const MetricRow = ({ label, value, isLast = false }: { label: string; value: string | number; isLast?: boolean }) => (
    <View style={[styles.metricRow, isLast ? styles.metricRowLast : {}]}>
        <Text style={styles.metricLabel}>{label}:</Text>
        <Text style={styles.metricValue}>{value}</Text>
    </View>
);

// ============================================================================
// Helper: Get final standing text
// ============================================================================

function getFinalStandingText(standing: string): string {
    switch (standing) {
        case 'top_10':
            return 'Top 10th Percentile!';
        case 'top_50':
            return 'Top 50th Percentile!';
        default:
            return 'League Completed. Congrats!';
    }
}

// ============================================================================
// Main PDF Component
// ============================================================================

interface LeagueReportPDFProps {
    data: LeagueReportData;
}

export function LeagueReportPDF({ data }: LeagueReportPDFProps) {
    const totalPoints = data.finalIndividualScore;

    return (
        <Document>
            {/* Single Page Report */}
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Logo src={data.league.logoUrl} placeholderText="LEAGUE" />
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.brandText}>MY FITNESS LEAGUE</Text>
                        <Text style={styles.reportTitle}>{data.league.name} Summary Report</Text>
                        <Text style={styles.reportSubtitle}>
                            Oct 25, 2025 - Jan 22, 2026
                        </Text>
                    </View>
                    <Logo src={data.team?.logoUrl || null} placeholderText="TEAM" />
                </View>

                {/* User Info Row */}
                <View style={styles.userInfoRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.userName}>{data.user.username}</Text>
                        {data.team && (
                            <Text style={styles.teamName}>| {data.team.name}</Text>
                        )}
                    </View>
                    <View style={styles.statsHighlight}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total Points</Text>
                            <Text style={styles.statValue}>{totalPoints}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Avg RR</Text>
                            <Text style={styles.statValue}>{data.averageRR.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Two Column Layout: Performance Overview | Individual Standing */}
                <View style={styles.columnsContainer}>
                    {/* Left Column - Performance Overview */}
                    <View style={styles.column}>
                        <Section title="Performance Overview">
                            <MetricRow label="Points earned for team" value={data.performance.totalActivities} />
                            <MetricRow label="Rest Days Taken" value={data.restDays.total} />
                            <MetricRow label="Active Days" value={data.performance.totalActiveDays} />
                            <MetricRow label="Missed Days" value={data.performance.totalMissedDays} />
                            <MetricRow label="Best Streak (consecutive workout days)" value={`${data.performance.bestStreak} Days`} isLast />
                        </Section>
                    </View>

                    {/* Right Column - Individual Standing */}
                    <View style={styles.column}>
                        <Section title="Individual Standing">
                            <View style={styles.finalStandingContainer}>
                                <View style={styles.trophyCircle}>
                                    <TrophyIcon size={22} />
                                </View>
                                <Text style={styles.finalRankText}>
                                    {getFinalStandingText(data.finalStanding)}
                                </Text>
                                <Text style={styles.finalPointsText}>
                                    {totalPoints} Total Points | {data.averageRR.toFixed(2)} Avg RR
                                </Text>
                            </View>
                        </Section>
                    </View>
                </View>

                {/* Activity Details Table */}
                <Text style={styles.activityTitle}>Activity Details</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Activity</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Sessions</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Distance</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Steps</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Duration</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Avg/Session</Text>
                    </View>
                    {data.activities.length > 0 ? (
                        data.activities.map((activity, index) => {
                            // Calculate avg per session
                            const avgDistance = activity.totalDistance && activity.sessionCount > 0
                                ? (activity.totalDistance / activity.sessionCount).toFixed(1)
                                : null;
                            const avgSteps = activity.totalSteps && activity.sessionCount > 0
                                ? Math.round(activity.totalSteps / activity.sessionCount)
                                : null;
                            const avgDuration = formatAvgDuration(activity.totalDuration, activity.sessionCount);
                            
                            // Determine what to show in avg column based on activity type
                            let avgValue = '-';
                            if (activity.activityName.toLowerCase() === 'steps' && avgSteps) {
                                avgValue = avgSteps.toLocaleString();
                            } else if (avgDistance && activity.totalDistance) {
                                avgValue = `${avgDistance} km`;
                            } else if (avgDuration !== '-') {
                                avgValue = avgDuration;
                            }

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.tableRow,
                                        index % 2 === 1 ? styles.tableRowAlt : {}
                                    ]}
                                >
                                    <Text style={[styles.tableCellBold, { flex: 2 }]}>
                                        {activity.activityName}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                                        {activity.sessionCount}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center' }]}>
                                        {activity.totalDistance ? `${activity.totalDistance.toFixed(1)} km` : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center' }]}>
                                        {activity.totalSteps ? activity.totalSteps.toLocaleString() : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center' }]}>
                                        {formatDuration(activity.totalDuration)}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center' }]}>
                                        {avgValue}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 1 }]}>No activities recorded</Text>
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Generated on {formatDate(data.generatedAt)} • MyFitnessLeague
                    </Text>
                </View>
            </Page>
        </Document>
    );
}

export default LeagueReportPDF;
