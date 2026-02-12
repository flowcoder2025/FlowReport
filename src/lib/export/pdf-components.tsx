import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { MonthlyReportData, formatPdfValue } from './pdf-generator'
import { STATUS_COLORS } from '@/constants'

// Noto Sans KR 폰트 등록 (Google Fonts CDN)
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA.ttf',
      fontWeight: 700,
    },
  ],
})

// 스타일 정의
const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansKR',
    fontSize: 10,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1f2937',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  // KPI 스타일
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 3,
  },
  kpiChange: {
    fontSize: 9,
  },
  kpiChangePositive: {
    color: STATUS_COLORS.positive,
  },
  kpiChangeNegative: {
    color: STATUS_COLORS.negative,
  },
  // 채널믹스 스타일
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelName: {
    width: '30%',
    fontSize: 10,
    color: '#374151',
  },
  channelBar: {
    width: '55%',
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  channelBarFill: {
    height: '100%',
    backgroundColor: STATUS_COLORS.primary,
    borderRadius: 2,
  },
  channelPercent: {
    width: '15%',
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
  },
  // SNS 테이블 스타일
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontWeight: 700,
    fontSize: 10,
    color: '#374151',
  },
  tableCell: {
    fontSize: 10,
    color: '#1f2937',
  },
  tableCellChannel: {
    width: '40%',
  },
  tableCellFollowers: {
    width: '30%',
  },
  tableCellEngagement: {
    width: '30%',
    textAlign: 'right' as const,
  },
  // Insights 스타일
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightColumn: {
    width: '31%',
  },
  insightColumnTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: '#1f2937',
  },
  insightItem: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 5,
    paddingLeft: 8,
  },
  insightBullet: {
    position: 'absolute',
    left: 0,
    top: 0,
    fontSize: 9,
  },
  insightItemContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  // Footer 스타일
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

// 월 이름 (한글)
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

interface MonthlyReportDocumentProps {
  data: MonthlyReportData
}

/**
 * 월간 리포트 PDF 문서 컴포넌트
 */
export function MonthlyReportDocument({ data }: MonthlyReportDocumentProps) {
  const periodLabel = `${data.period.year}년 ${MONTH_NAMES[data.period.month - 1]}`
  const generatedDate = new Date().toLocaleDateString('ko-KR')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.workspace.name}</Text>
          <Text style={styles.subtitle}>{periodLabel} 월간 마케팅 리포트</Text>
        </View>

        {/* KPI Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>핵심 지표 (KPI)</Text>
          <View style={styles.kpiGrid}>
            {data.kpis.map((kpi, index) => (
              <View key={index} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiValue}>
                  {formatPdfValue(kpi.value, kpi.format)}
                </Text>
                <Text
                  style={[
                    styles.kpiChange,
                    kpi.change >= 0 ? styles.kpiChangePositive : styles.kpiChangeNegative,
                  ]}
                >
                  {kpi.change >= 0 ? '▲' : '▼'} {Math.abs(kpi.change).toFixed(1)}% vs 전월
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Channel Mix Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>채널별 매출 비중</Text>
          {data.channelMix.map((channel, index) => (
            <View key={index} style={styles.channelRow}>
              <Text style={styles.channelName}>{channel.name}</Text>
              <View style={styles.channelBar}>
                <View style={[styles.channelBarFill, { width: `${channel.percentage}%` }]} />
              </View>
              <Text style={styles.channelPercent}>{channel.percentage}%</Text>
            </View>
          ))}
        </View>

        {/* SNS Performance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SNS 성과</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableCellChannel]}>채널</Text>
              <Text style={[styles.tableHeaderCell, styles.tableCellFollowers]}>팔로워</Text>
              <Text style={[styles.tableHeaderCell, styles.tableCellEngagement]}>참여율</Text>
            </View>
            {data.snsPerformance.map((sns, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellChannel]}>{sns.channel}</Text>
                <Text style={[styles.tableCell, styles.tableCellFollowers]}>
                  {new Intl.NumberFormat('ko-KR').format(sns.followers)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellEngagement]}>
                  {sns.engagement.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인사이트 & 액션 플랜</Text>
          <View style={styles.insightsGrid}>
            {/* 성과 */}
            <View style={styles.insightColumn}>
              <Text style={styles.insightColumnTitle}>✓ 주요 성과</Text>
              {data.insights.achievements.map((item, index) => (
                <View key={index} style={styles.insightItemContainer}>
                  <Text style={styles.insightItem}>• {item}</Text>
                </View>
              ))}
            </View>

            {/* 개선점 */}
            <View style={styles.insightColumn}>
              <Text style={styles.insightColumnTitle}>△ 개선 필요</Text>
              {data.insights.improvements.map((item, index) => (
                <View key={index} style={styles.insightItemContainer}>
                  <Text style={styles.insightItem}>• {item}</Text>
                </View>
              ))}
            </View>

            {/* 다음 달 포커스 */}
            <View style={styles.insightColumn}>
              <Text style={styles.insightColumnTitle}>→ 다음 달 집중</Text>
              {data.insights.nextMonthFocus.map((item, index) => (
                <View key={index} style={styles.insightItemContainer}>
                  <Text style={styles.insightItem}>• {item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by FlowReport</Text>
          <Text style={styles.footerText}>{generatedDate}</Text>
        </View>
      </Page>
    </Document>
  )
}
