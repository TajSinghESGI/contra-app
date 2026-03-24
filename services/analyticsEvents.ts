// All analytics events in one place
export const AnalyticsEvents = {
  // Auth
  SIGNUP_STARTED: 'Signup Started',
  SIGNUP_COMPLETED: 'Signup Completed',
  LOGIN: 'Login',
  LOGOUT: 'Logout',

  // Onboarding
  TOPIC_SELECTED: 'Topic Selected',
  DIFFICULTY_SELECTED: 'Difficulty Selected',

  // Debate
  DEBATE_STARTED: 'Debate Started',
  DEBATE_MESSAGE_SENT: 'Debate Message Sent',
  DEBATE_COMPLETED: 'Debate Completed',
  DEBATE_SCORE_VIEWED: 'Debate Score Viewed',
  ANALYSIS_VIEWED: 'Analysis Viewed',
  COACHING_VIEWED: 'Coaching Viewed',

  // Paywall
  PAYWALL_VIEWED: 'Paywall Viewed',
  PAYWALL_PLAN_SELECTED: 'Paywall Plan Selected',
  PURCHASE_STARTED: 'Purchase Started',
  PURCHASE_COMPLETED: 'Purchase Completed',
  PURCHASE_CANCELLED: 'Purchase Cancelled',
  RESTORE_STARTED: 'Restore Started',

  // Social
  FRIEND_ADDED: 'Friend Added',
  CHALLENGE_SENT: 'Challenge Sent',

  // Navigation
  TAB_VIEWED: 'Tab Viewed',
  RANKINGS_VIEWED: 'Rankings Viewed',
} as const;
