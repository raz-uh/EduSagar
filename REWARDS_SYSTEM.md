# 🏆 EduSagar Rewards & Points System

## Overview

The **EduSagar Rewards System** provides multiple ways for users to earn points, badges, and monthly rewards through consistent learning. This document explains how the system works and how to implement it in your app.

---

## 📊 Points Structure

### Base Points (Per Activity)

| Activity | Points | Description |
|----------|--------|-------------|
| Complete Lesson | 10 pts | Finish a lesson module |
| Correct Quiz Answer | 5 pts | Each correct answer |
| Complete Module | 50 pts | Finish entire module |
| Complete Course | 200 pts | Finish full course |
| SRS Flashcard Review | 2 pts | Spaced repetition review |

### How Points Are Calculated

Base points are multiplied by **Streak Multiplier**:

```
Earned Points = Base Points × Streak Multiplier
```

#### Streak Multipliers

| Streak Duration | Multiplier | Bonus |
|-----------------|-----------|-------|
| 1-2 days | 1.0x | 0% |
| 3-6 days | 1.1x | 10% |
| 7-29 days | 1.25x | 25% |
| 30+ days | 1.5x | 50% |

**Example:**
- User with 7-day streak completes lesson (10 points)
- Actual earned: 10 × 1.25 = **12.5 points** (rounded to 12)

---

## 📅 Weekly Rewards

### How Weekly Rewards Work

1. **Threshold**: Earn **100 points per week**
2. **Bonus**: If threshold is met → Get **50 bonus points**
3. **Reset**: Weekly points reset every **Monday at 00:00 UTC**

### Weekly Progress Example

```
Week 1 (Mon-Sun):
- Monday: 15 points earned (Total: 15)
- Tuesday: 12 points earned (Total: 27)
- Wednesday: 18 points earned (Total: 45)
- Thursday: 25 points earned (Total: 70)
- Friday: 20 points earned (Total: 90)
- Saturday: 15 points earned (Total: 105) ✅ THRESHOLD MET!

Result: 50 bonus points awarded! 🎉
Weekly points reset to 0 on Monday.
```

### Weekly Bonus Calculation

```typescript
import { calculateWeeklyReward } from './services/rewardsService';

const user = getCurrentUser();
const reward = calculateWeeklyReward(user);

if (reward.weeklyBonusAwarded) {
  console.log(`Earned ${reward.newWeeklyPoints} bonus points!`);
}
```

---

## 📆 Monthly Rewards

### How Monthly Rewards Work

1. **Threshold**: Earn **500 points per month**
2. **Bonus**: If threshold is met → Get **300 bonus points**
3. **Period**: Calendar month (1st to last day)

### Monthly Bonus Flow

```
January Month:
- Week 1: 120 points (Weekly bonus: +50 = 170 total)
- Week 2: 130 points (Weekly bonus: +50 = 180 total)
- Week 3: 115 points (Weekly bonus: +50 = 165 total)
- Week 4: 125 points (Weekly bonus: +50 = 175 total)

Total: 170 + 180 + 165 + 175 = 690 points ✅

At month end:
Earned 690 > 500 threshold
Bonus awarded: +300 points! 🏆
```

### Implementation

```typescript
import { calculateMonthlyReward, awardMonthlyBonus } from './services/rewardsService';

// Check if user qualifies for monthly bonus
const monthlyReward = await calculateMonthlyReward(user);

if (monthlyReward.monthlyBonusAwarded) {
  await awardMonthlyBonus(user.id, user);
  console.log('🏆 Monthly Master achieved!');
}
```

---

## ⚡ Streak System

### How Streaks Work

A **learning streak** tracks consecutive days of activity.

### Streak Rules

| Scenario | Result |
|----------|--------|
| User active today | Streak maintained |
| User active yesterday, not today | Streak +1 |
| User inactive 2+ days | Streak resets to 0 |

### Streak Benefits

Streaks provide **point multipliers**:

- **3-day streak**: 10% point bonus
- **7-day streak**: 25% point bonus
- **30-day streak**: 50% point bonus

### Example: Streak Impact

```
Without Streak (1 day):
Complete Lesson = 10 points

With 7-day Streak:
Complete Lesson = 10 × 1.25 = 12 points (25% bonus)

With 30-day Streak:
Complete Lesson = 10 × 1.5 = 15 points (50% bonus)
```

### Track Streak

```typescript
import { updateStreak } from './services/rewardsService';

const { newStreak, streakBroken } = updateStreak(user, user.lastActiveDate);

setUser({
  ...user,
  streak: newStreak,
  lastActiveDate: new Date()
});

if (streakBroken) {
  showNotification('Streak lost! Start new streak today.');
}
```

---

## 🎖️ Badge System

### Available Badges

| Badge | Requirement | Points |
|-------|-------------|--------|
| **Early Bird** 🔥 | First session | 0 |
| **Syllabus Master** 📚 | 500 points | 500 |
| **Grand Scholar** 🏆 | 1000 points | 1000 |
| **Consistent Scholar** 🔥 | 5-day streak | Streak |
| **Weekly Champion** 🥇 | 100+ weekly points | 500 |
| **Monthly Master** 👑 | 500+ monthly points | 2000 |
| **Identity Verified** 🛡️ | Link Web3 wallet | Custom |

### Badge Earning Logic

```typescript
import { checkAndAwardBadges } from './services/rewardsService';

// Check for new badges when user earns points
const newBadges = await checkAndAwardBadges(user);

if (newBadges.length > 0) {
  newBadges.forEach(badge => {
    showNotification(`🎉 New Badge: ${badge.name}!`);
  });
}
```

### Display Badges

```tsx
{user.badges.map(badge => (
  <div key={badge.id} className="flex items-center gap-2">
    <span className="text-2xl">{getBadgeEmoji(badge.id)}</span>
    <div>
      <h4 className="font-bold">{badge.name}</h4>
      <p className="text-sm text-gray-600">{badge.description}</p>
    </div>
  </div>
))}
```

---

## 📊 Leaderboard

### Leaderboard View

Users are ranked by total points earned:

```typescript
import { getLeaderboard } from './services/rewardsService';

const topLearners = await getLeaderboard(100);

topLearners.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name} - ${user.total_points} points`);
  console.log(`   Streak: ${user.streak} days`);
  console.log(`   Courses: ${user.courses_enrolled}`);
});
```

### Display Leaderboard

```tsx
<div className="space-y-3">
  {leaderboard.map((user, idx) => (
    <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-indigo-600">#{idx + 1}</span>
        <img src={user.avatar} className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-gray-600">{user.streak} day streak</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold">{user.total_points}</p>
        <p className="text-xs text-gray-500">points</p>
      </div>
    </div>
  ))}
</div>
```

---

## 📈 Progress Tracking

### Weekly Progress

Show user progress toward weekly bonus:

```typescript
import { getWeeklyProgress } from './services/rewardsService';

const weeklyPercent = getWeeklyProgress(user);

<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-indigo-600 h-2 rounded-full"
    style={{ width: `${weeklyPercent}%` }}
  />
</div>
<p className="text-sm text-gray-600">
  {user.weeklyPoints}/100 weekly points
</p>
```

### Monthly Progress

Show user progress toward monthly master:

```typescript
import { getMonthlyProgress } from './services/rewardsService';

const monthlyPercent = await getMonthlyProgress(user);

<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-purple-600 h-2 rounded-full"
    style={{ width: `${monthlyPercent}%` }}
  />
</div>
<p className="text-sm text-gray-600">
  {user.totalPoints}/500 monthly points
</p>
```

### Next Milestone

```typescript
import { getNextMilestone } from './services/rewardsService';

const milestone = getNextMilestone(user);

<div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
  <p className="font-bold mb-2">{milestone.message}</p>
  <div className="flex items-center justify-between">
    <span>🎁 Reward: +{milestone.reward} points</span>
    <span>📍 {milestone.pointsNeeded} points left</span>
  </div>
</div>
```

---

## 🔄 Automated Reward Distribution

### Setup Required (Supabase)

Rewards are distributed automatically via **Supabase Edge Functions** or **Cron Jobs**.

#### Weekly Reset (Every Monday 00:00 UTC)

```sql
-- SQL Cron Job in Supabase
SELECT cron.schedule('reset-weekly-points', '0 0 * * MON', $$
  UPDATE users SET weekly_points = 0
$$);
```

#### Monthly Bonus (Every 1st at 00:00 UTC)

```sql
-- SQL Cron Job in Supabase
SELECT cron.schedule('award-monthly-bonus', '0 0 1 * *', $$
  UPDATE users 
  SET total_points = total_points + 300
  WHERE total_points > 500
$$);
```

### Client-Side Notification

Check for rewards on app load:

```typescript
useEffect(() => {
  if (user) {
    checkAndNotifyRewards();
  }
}, [user]);

async function checkAndNotifyRewards() {
  // Check weekly
  const weeklyReward = calculateWeeklyReward(user);
  if (weeklyReward.weeklyBonusAwarded) {
    showNotification('🎉 ' + weeklyReward.message);
  }
  
  // Check monthly
  const monthlyReward = await calculateMonthlyReward(user);
  if (monthlyReward.monthlyBonusAwarded) {
    showNotification('🏆 ' + monthlyReward.message);
  }
  
  // Check badges
  const newBadges = await checkAndAwardBadges(user);
  newBadges.forEach(badge => {
    showNotification(`🎖️ New Badge: ${badge.name}`);
  });
}
```

---

## 💡 Implementation Tips

### 1. Award Points When Lesson is Completed

```typescript
const handleCompleteLesson = async (lessonId: string) => {
  // Calculate earned points with streak multiplier
  const earnedPoints = calculateEarnedPoints(10, user.streak);
  
  // Update user
  const updated = {
    ...user,
    totalPoints: user.totalPoints + earnedPoints,
    weeklyPoints: user.weeklyPoints + earnedPoints
  };
  
  setUser(updated);
  showNotification(`+${earnedPoints} points! ${getNextMilestone(user).message}`);
};
```

### 2. Update Streak on Login

```typescript
useEffect(() => {
  if (user) {
    const { newStreak, streakBroken } = updateStreak(user);
    
    if (streakBroken) {
      setUser({ ...user, streak: 0 });
      showNotification('⚠️ Streak lost! Start fresh today.');
    } else if (newStreak > user.streak) {
      setUser({ ...user, streak: newStreak });
      showNotification(`🔥 ${newStreak} day streak!`);
    }
  }
}, []);
```

### 3. Notification Templates

```typescript
const getRewardNotification = (pointsEarned: number, reason: string) => {
  const milestone = getNextMilestone(user);
  
  return {
    title: `+${pointsEarned} points`,
    description: reason,
    action: milestone.message,
    icon: '⭐'
  };
};
```

---

## 📱 UI Components

### Reward Display Widget

```tsx
<div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
  {/* Points Section */}
  <div className="mb-6">
    <p className="text-sm opacity-90">Total Points</p>
    <h1 className="text-4xl font-bold">{user.totalPoints}</h1>
  </div>
  
  {/* Weekly Progress */}
  <div className="mb-4">
    <div className="flex justify-between mb-2">
      <span className="text-sm">Weekly Progress</span>
      <span className="text-sm">{user.weeklyPoints}/100</span>
    </div>
    <div className="w-full bg-white/20 rounded-full h-2">
      <div 
        className="bg-green-400 h-2 rounded-full transition-all"
        style={{ width: `${Math.min(user.weeklyPoints, 100)}%` }}
      />
    </div>
  </div>
  
  {/* Streak Display */}
  <div className="flex items-center gap-2">
    <Flame size={20} className="text-orange-300" />
    <span className="font-bold">{user.streak} day streak</span>
  </div>
</div>
```

---

## 🎯 Gamification Strategies

### Motivation Mechanics

1. **Daily Engagement**: Encourage daily 30-min sessions
2. **Weekly Goals**: Easy to achieve (100 points)
3. **Monthly Challenges**: Significant rewards (300 points)
4. **Streak Incentives**: Higher multipliers boost engagement
5. **Badge Showcase**: Display achievements publicly
6. **Leaderboard**: Friendly competition

### Example Engagement Flow

```
Day 1: User earns 10 pts → Early Bird badge 🔥
Day 3: User reaches 3-day streak → 10% bonus activated ⚡
Day 7: User reaches 7-day streak → 25% bonus activated 🔥
Week 1: User earns 100 pts → Weekly bonus +50 → Weekly Champion badge 🥇
Month 1: User earns 500+ pts → Monthly bonus +300 → Monthly Master badge 👑
```

---

## 🐛 Testing Rewards

### Manual Testing

```typescript
// Test weekly reward
user.weeklyPoints = 100;
const weekly = calculateWeeklyReward(user);
console.assert(weekly.weeklyBonusAwarded === true);

// Test streak multiplier
const points = calculateEarnedPoints(10, 7); // 7-day streak
console.assert(points === 12); // Should be 12 (10 * 1.25)

// Test badge earning
user.totalPoints = 1000;
const badges = await checkAndAwardBadges(user);
console.assert(badges.some(b => b.id === 'top_learner'));
```

---

## 📚 Related Files

- **rewardsService.ts** - Complete rewards logic (this file)
- **App.tsx** - Integrate rewards into main app
- **types.ts** - UserProfile, Badge types
- **supabaseService.ts** - Database operations
- **supabase-schema-complete.sql** - Database setup with rewards tables

---

## 🔗 Next Steps

1. ✅ **Created**: `rewardsService.ts` with all functions
2. ⏳ **Integrate**: Import and use in `App.tsx`
3. ⏳ **Setup**: Create Supabase cron jobs for auto-rewards
4. ⏳ **Display**: Add reward widgets to UI
5. ⏳ **Test**: Verify all reward flows work

---

**Version:** 1.0  
**Last Updated:** February 7, 2026  
**Status:** 🟢 Ready for Implementation

