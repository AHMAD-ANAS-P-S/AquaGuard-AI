# AquaGuard AI - Dual Dashboard Architecture

## Overview

AquaGuard AI features a sophisticated dual dashboard system that provides tailored experiences for different user roles:

### 1. Community Dashboard 🌍
**For:** Citizens, ASHA Workers  
**Purpose:** Report issues, access safety information, and stay informed

### 2. Official Dashboard 🏢
**For:** District Health Officials, State Authorities, Administrators  
**Purpose:** Monitor data, coordinate response, and manage alerts

---

## User Roles

### Role Types

1. **Citizen** (Community Member)
   - Report health symptoms
   - Report water quality issues
   - View local risk alerts
   - Access awareness content
   - Use voice assistant

2. **ASHA Worker**
   - All citizen permissions
   - Upload test strip photos
   - Submit field reports
   - Assist community members

3. **Health Official**
   - Monitor live data
   - Manage alerts
   - View analytics
   - Coordinate response
   - Download reports

4. **Administrator**
   - Full system access
   - User management
   - Role assignment
   - System configuration

---

## Community Dashboard Features

### 🏠 Main Features

#### 1. Village Risk Status
- Real-time health risk indicator
- Color-coded status (🟢 Safe / 🟡 Caution / 🔴 High Risk)
- Risk score (0-100)
- Last updated timestamp

#### 2. Quick Report Actions
- **Report Health Issue**: Submit symptoms and case counts
- **Report Water Issue**: Flag water contamination
- **Voice Assistant**: Report using speech (multilingual)
- **Photo Upload**: Attach evidence or test strips

#### 3. Active Alerts Panel
- View community alerts
- Severity indicators
- Location details
- Action guidance

#### 4. My Reports Tracking
- View submitted reports
- Check report status
- Track community impact

#### 5. Learn & Earn Section
- Health awareness content
- Educational videos
- Interactive quizzes
- Earn certificates

### 📱 User Flow Example

```
Villager notices water issue
    ↓
Opens Community Dashboard
    ↓
Taps "Report Water Issue"
    ↓
Uses voice/text to describe problem
    ↓
System processes and alerts ASHA worker
    ↓
Dashboard updates risk status
    ↓
Community receives notification
```

---

## Official Dashboard Features

### 📊 Main Features

#### 1. Live Statistics
- Active alerts count
- Total health reports
- Active IoT devices
- High-risk areas

#### 2. Risk Heatmap
- Interactive village map
- Color-coded risk zones
- Real-time updates
- Drill-down details

#### 3. Alert Management
- View all active alerts
- Escalation status
- Response timeline
- Action logging

#### 4. IoT Monitoring
- Sensor network status
- Water quality trends
- Device health
- Battery levels

#### 5. AI Predictions
- Outbreak probability
- Risk forecasting
- Confidence scores
- Trend analysis

#### 6. Analytics Dashboard
- Water quality graphs (pH, TDS, temperature)
- Disease pattern charts
- Response time metrics
- Community engagement stats

#### 7. Action Log System
- Track all official actions
- Response timestamps
- Accountability records
- Audit trail

#### 8. Report Export
- Download CSV/PDF reports
- Filter by date range
- Include all data points
- Shareable formats

### 🎯 Official Workflow

```
Sensor detects contamination
    ↓
IoT system creates alert
    ↓
Official Dashboard shows notification
    ↓
Level 1: ASHA Worker notified (5 min timer)
    ↓
No response → Level 2: District Officer (10 min)
    ↓
No response → Level 3: State Health Dept (15 min)
    ↓
Action logged with timestamps
    ↓
System tracks resolution
```

---

## Access Control & Security

### Role Assignment

New users are automatically redirected to **Role Selector** page on first login.

#### Default Assignment
- First-time users → Citizen role
- Can request role upgrade
- Admins approve role changes

### Security Features

1. **Row-Level Security (RLS)**
   - Role-based data access
   - User-specific queries
   - Secure by default

2. **Function-Based Role Checking**
   - `has_role(_user_id, _role)`: Check if user has specific role
   - `get_user_roles(_user_id)`: Get all user roles
   - Security definer functions prevent RLS recursion

3. **Policy-Based Access**
   - Citizens: View own data
   - ASHA Workers: Submit reports
   - Officials: View all data
   - Admins: Full access

---

## Dashboard Switching

Users with multiple roles can switch between dashboards:

1. Click profile menu (bottom of sidebar)
2. Select "Switch Dashboard"
3. Toggle between Community ↔ Official views

---

## Navigation Differences

### Community Navigation
```
Dashboard → Report Issue → Alerts → Map → Learn & Earn
```

### Official Navigation
```
Dashboard → Manage Alerts → Escalation → IoT → Reports → Heatmap
```

---

## Key Differences Table

| Feature | Community Dashboard | Official Dashboard |
|---------|-------------------|-------------------|
| **Primary Goal** | Report & Learn | Monitor & Respond |
| **Data Scope** | Local village | All villages |
| **Alert Actions** | View only | Manage & resolve |
| **IoT Access** | Risk indicators | Full sensor data |
| **Analytics** | Basic stats | Advanced charts |
| **Reports** | Submit only | View all + export |
| **Escalation** | Not visible | Full visibility |
| **Voice Features** | Report via voice | Not needed |
| **Certificates** | Available | Not applicable |

---

## Mobile Experience

Both dashboards are fully responsive:

- **Mobile Navigation**: Hamburger menu
- **Touch Optimized**: Large tap targets
- **Offline Support**: PWA functionality
- **Voice Features**: Mobile speech recognition

---

## Integration Points

### Community → Official Flow

1. **Report Submission**
   ```
   Community report → Database → Official alert
   ```

2. **Alert Creation**
   ```
   Citizen report → Automated alert → Official notification
   ```

3. **Response Tracking**
   ```
   Official action → Log creation → Community status update
   ```

### IoT → Dashboard Flow

1. **Sensor Data**
   ```
   ESP32 sensor → Edge function → Database → Both dashboards
   ```

2. **Automatic Alerts**
   ```
   Critical reading → Alert creation → Official escalation → Community notification
   ```

---

## Getting Started

### For Citizens/ASHA Workers

1. Sign up / Login
2. Select "Community Member" or "ASHA Worker" role
3. Access Community Dashboard
4. Complete profile
5. Start reporting issues

### For Officials

1. Login with official credentials
2. Admin assigns "Health Official" or "Admin" role
3. Access Official Dashboard
4. Configure notification preferences
5. Start monitoring

---

## Best Practices

### For Community Users
- ✅ Report issues promptly
- ✅ Include photos when possible
- ✅ Use voice feature for quick reports
- ✅ Complete awareness quizzes
- ✅ Check alerts regularly

### For Officials
- ✅ Respond to alerts within time limits
- ✅ Log all actions taken
- ✅ Monitor escalation system
- ✅ Download weekly reports
- ✅ Review AI predictions

---

## Technical Architecture

### Database Tables

- `user_roles`: Role assignments
- `action_logs`: Official actions
- `alert_escalation_logs`: Escalation tracking
- `notification_preferences`: User settings
- `ai_predictions`: AI-generated forecasts

### API Endpoints

- `/community-dashboard`: Community view
- `/official-dashboard`: Official view
- `/role-selector`: Role assignment
- All standard CRUD endpoints

### Real-Time Features

- Live alert updates
- Sensor data streaming
- Escalation notifications
- Risk score changes

---

## Troubleshooting

### Issue: Wrong dashboard shown
**Solution**: Check user roles in profile → Contact admin for role update

### Issue: Can't submit reports
**Solution**: Verify village assignment → Check internet connection

### Issue: Alerts not appearing
**Solution**: Check notification preferences → Refresh page

### Issue: IoT data missing
**Solution**: Verify sensor connectivity → Check device status in IoT Monitoring

---

## Future Enhancements

### Community Dashboard
- [ ] SMS-based reporting
- [ ] Offline form sync
- [ ] Community chat
- [ ] Reward system

### Official Dashboard
- [ ] Predictive analytics
- [ ] Resource allocation tools
- [ ] Inter-district coordination
- [ ] Mobile app for officials

---

## Support

For technical support or role changes:
- Contact system administrator
- Check documentation: `/awareness`
- Use voice assistant for help

---

## Summary

The dual dashboard architecture ensures:
- ✅ **Right tools for right users**
- ✅ **Secure role-based access**
- ✅ **Efficient workflow separation**
- ✅ **Comprehensive monitoring**
- ✅ **Community empowerment**
- ✅ **Official accountability**

Both dashboards work together to create a complete health surveillance ecosystem!
