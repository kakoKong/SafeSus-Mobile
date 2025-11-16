import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // Modern Header
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  modernHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationBadgeText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  modernAuthButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Old header styles (kept for compatibility)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '500',
    marginTop: 2,
  },
  authButton: {
    padding: 8,
  },

  // Content
  content: {
    flex: 1,
  },

  // Modern Location Card
  modernLocationCard: {
    margin: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  locationGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modernLocationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  modernWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
  },
  modernWarningText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },

  // Old location card styles
  locationCard: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  locationCity: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  // Modern Section Headers
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modernSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modernSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },

  // Old section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconDanger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },

  // Modern Incident Cards (Grid Layout)
  modernCardGrid: {
    gap: 12,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  modernIncidentCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  incidentGradient: {
    padding: 16,
    minHeight: 160,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  incidentPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  incidentPulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fecaca',
    opacity: 0.5,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  distancePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  incidentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 20,
  },
  incidentDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },

  // Old alert cards
  alertListWrapper: {
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#b91c1c',
  },
  alertIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  alertSeverityDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b91c1c',
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  alertChip: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 6,
  },
  alertMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Modern Tips Cards
  modernTipCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tipGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tipIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
  },
  tipDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 10,
  },
  tipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  tipBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },

  // Old tip/card styles
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },

  // Modern Quick Actions
  modernQuickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modernActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modernActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },

  // Old quick actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Modern View All Button
  modernViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modernViewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },

  // Old view all button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },

  // Info banners
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },

  // Modern Empty States
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  modernEmptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },

  // Old empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },

  // Cities
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  citySlug: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Centered Modal Styles
  centeredModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  centeredModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  centeredModalClose: {
    position: 'absolute',
    top: -12,
    right: -12,
    zIndex: 10,
    backgroundColor: '#64748b',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  centeredModalIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  centeredModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  centeredModalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  centeredModalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
  centeredModalScroll: {
    maxHeight: 300,
  },
  centeredModalDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  centeredModalInfo: {
    gap: 16,
  },
  centeredModalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  centeredModalInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredModalInfoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  centeredModalInfoValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  locationBackgroundImage: {
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
  },
  locationBackgroundImageInner: {
    borderRadius: 20,
  },
  locationOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)', // dark overlay for readability
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

});

