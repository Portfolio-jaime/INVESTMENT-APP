# TRII Investment App - Binary Distribution Plan

**Version**: 1.0
**Last Updated**: 2025-12-30
**Status**: ✅ Ready for Implementation

---

## Executive Summary

This document outlines the comprehensive strategy for transforming the TRII Investment Platform into a **professional, installable desktop application** with auto-update capabilities across Windows, macOS, and Linux.

**Current State**: Electron-based desktop client with microservices backend deployed via Docker Compose/Kubernetes.

**Target State**: Single-click installable application with Docker Desktop integration, auto-update mechanism, and professional code signing.

---

## 1. Architecture Decision: Hybrid Docker Desktop Integration

### Chosen Approach ✅

**Docker Desktop Integration** (Recommended)

**Rationale**:
- Smaller installer (~200MB vs 1GB+ if fully embedded)
- Professional service isolation
- Industry-standard containerization
- Easy updates and resource management
- Target users (investors/traders) typically have Docker installed

**Architecture Diagram**:

```
┌─────────────────────────────────────────────────────────────┐
│                 TRII Desktop Application                     │
│                   (Electron Container)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐      ┌──────────────────────────┐      │
│  │  React UI      │◄─────┤  Backend Manager         │      │
│  │  (Renderer)    │      │  (Main Process)          │      │
│  └────────────────┘      └──────────┬───────────────┘      │
│                                      │                        │
│                           ┌──────────▼──────────┐           │
│                           │  Docker Controller  │           │
│                           │  - Start/Stop       │           │
│                           │  - Health Checks    │           │
│                           │  - Port Management  │           │
│                           └──────────┬──────────┘           │
└────────────────────────────────────┼──────────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │      Docker Desktop               │
                    │  (docker-compose.yml bundled)     │
                    ├───────────────────────────────────┤
                    │  Infrastructure Services:         │
                    │  - PostgreSQL (TimescaleDB)       │
                    │  - Redis                          │
                    │  - RabbitMQ                       │
                    │  - MinIO                          │
                    ├───────────────────────────────────┤
                    │  Application Services:            │
                    │  - market-data (8001)             │
                    │  - analysis-engine (8002)         │
                    │  - portfolio-manager (8003)       │
                    │  - ml-prediction (8004)           │
                    │  - api-gateway (8080)             │
                    └───────────────────────────────────┘
```

---

## 2. File Structure

```
investment-app/
├── apps/desktop-client/
│   ├── src/
│   │   ├── main/
│   │   │   ├── main.ts
│   │   │   ├── backend-manager.ts      # NEW: Docker controller
│   │   │   ├── update-manager.ts       # NEW: Auto-update logic
│   │   │   └── system-requirements.ts  # NEW: Prerequisites checker
│   │   └── renderer/
│   │       ├── components/
│   │       │   ├── SetupWizard/        # NEW: First-time setup
│   │       │   ├── UpdateNotification/ # NEW: Update UI
│   │       │   └── ServiceStatus/      # NEW: Backend health
│   │       └── store/                  # NEW: Zustand state
│   ├── resources/                      # NEW: Build resources
│   │   ├── icon.icns                   # macOS
│   │   ├── icon.ico                    # Windows
│   │   ├── icon.png                    # Linux
│   │   └── docker/
│   │       └── docker-compose.yml      # Bundled config
│   ├── certificates/                   # Code signing
│   └── electron-builder.json           # Build configuration
│
├── .github/workflows/
│   ├── build-desktop-app.yml           # NEW: Multi-platform builds
│   └── release-desktop.yml             # NEW: Release automation
│
└── docs/en/
    ├── BINARY_DISTRIBUTION_PLAN.md     # This document
    ├── BUILD_GUIDE.md                  # Build instructions
    └── CODE_SIGNING_GUIDE.md           # Signing setup
```

---

## 3. Implementation Roadmap

### Phase 1: Foundation (Week 1-2) - 46 hours

**Priority: CRITICAL**

1. **Build Configuration** (4h)
   - Create `electron-builder.json`
   - Configure multi-platform builds
   - Set up build resources directory

2. **Application Icons** (8h)
   - Design professional icons (1024x1024 base)
   - Generate all required sizes (icns, ico, png)
   - Create installer graphics

3. **Backend Manager** (16h)
   - Implement `BackendManager` class
   - Docker service start/stop control
   - Health monitoring
   - Service logs access

4. **System Requirements Checker** (8h)
   - Docker installation detection
   - Memory/disk space validation
   - Prerequisites verification

5. **Testing** (8h)
   - Test Docker integration
   - Verify service lifecycle
   - Cross-platform testing

**Deliverables**:
- Working backend manager
- System requirements validation
- Icon assets ready

---

### Phase 2: Build Pipeline (Week 3) - 54 hours

**Priority: HIGH**

1. **GitHub Actions Workflow** (8h)
   - Multi-platform build jobs
   - Artifact upload/download
   - Release automation

2. **Code Signing Setup** (16h)
   - Apple Developer account
   - macOS certificate + notarization
   - Windows code signing cert
   - Configure CI/CD secrets

3. **Build Scripts** (8h)
   - `build-all-platforms.sh`
   - Platform-specific scripts
   - Signing automation

4. **Testing** (16h)
   - Test builds on all platforms
   - Verify code signatures
   - Installer testing

5. **CI/CD Configuration** (6h)
   - GitHub secrets setup
   - Workflow triggers
   - Release publishing

**Deliverables**:
- Automated build pipeline
- Signed installers
- GitHub Releases integration

---

### Phase 3: Auto-Update System (Week 4) - 44 hours

**Priority: HIGH**

1. **Update Manager** (12h)
   - Implement `UpdateManager` class
   - electron-updater integration
   - Update checking logic
   - Download/install flow

2. **Update UI Components** (8h)
   - `UpdateNotification` component
   - Progress indicators
   - User notifications

3. **IPC Handlers** (8h)
   - Main ↔ Renderer communication
   - Update events
   - State synchronization

4. **Testing** (12h)
   - Test update flow
   - Rollback scenarios
   - Error handling

5. **Configuration** (4h)
   - Update channels (stable/beta)
   - Auto-download settings
   - Update server config

**Deliverables**:
- Working auto-update
- Seamless installation
- User notifications

---

### Phase 4: Setup Wizard (Week 5) - 36 hours

**Priority: MEDIUM**

1. **UI Design** (8h)
   - Setup wizard mockups
   - User flow diagrams
   - Component design

2. **Wizard Steps** (24h)
   - WelcomeStep
   - DockerCheckStep
   - ConfigurationStep
   - CompletionStep

3. **Integration** (4h)
   - First-time launch detection
   - Settings persistence
   - Skip wizard option

**Deliverables**:
- Complete setup wizard
- First-time user onboarding
- Docker verification

---

### Phase 5: Service Management (Week 6) - 50 hours

**Priority: MEDIUM**

1. **Service Status UI** (8h)
   - Real-time health indicators
   - Service cards/dashboard
   - Visual feedback

2. **Health Monitoring** (8h)
   - HTTP health checks
   - Container status checks
   - Automatic recovery

3. **Service Controls** (14h)
   - Start/stop/restart buttons
   - Log viewer
   - Error notifications

4. **Error Recovery** (12h)
   - Automatic retry logic
   - User-friendly error messages
   - Troubleshooting guides

5. **Testing** (8h)
   - Service lifecycle testing
   - Error scenarios
   - Recovery mechanisms

**Deliverables**:
- Service control panel
- Health monitoring
- Error recovery

---

### Phase 6: Production Optimization (Week 7) - 60 hours

**Priority: MEDIUM**

1. **Docker Optimization** (8h)
   - Optimize Docker images
   - Multi-stage builds
   - Layer caching

2. **Bundle Optimization** (12h)
   - Production docker-compose
   - Environment configuration
   - Resource limits

3. **Analytics** (12h - Optional)
   - Usage tracking
   - Crash reporting (Sentry)
   - Performance metrics

4. **Performance Testing** (16h)
   - Load testing
   - Memory profiling
   - Startup optimization

5. **Security Audit** (12h)
   - Dependency scanning
   - Code review
   - Penetration testing

**Deliverables**:
- Optimized builds
- Crash reporting
- Performance benchmarks

---

### Phase 7: Documentation & Release (Week 8) - 84 hours

**Priority: HIGH**

1. **Documentation** (20h)
   - BUILD_GUIDE.md
   - CODE_SIGNING_GUIDE.md
   - USER_INSTALLATION_GUIDE.md
   - Troubleshooting guides

2. **Video Tutorials** (16h)
   - Installation walkthrough
   - Feature demonstrations
   - Getting started guide

3. **Beta Testing** (40h)
   - Recruit beta testers
   - Collect feedback
   - Fix critical bugs
   - Iterate on UX

4. **Release** (8h)
   - Create release notes
   - Publish v1.0.0
   - Announcement
   - Support channels

**Deliverables**:
- Complete documentation
- Video tutorials
- Production v1.0.0 release

---

## 4. Auto-Update Flow

```
App Startup
    │
    ▼ (Every 4 hours)
Check for Updates
    │
    ├─→ No Update Available → Continue
    │
    └─→ Update Available (v1.2.0)
        │
        └─→ Show Notification
            "Version 1.2.0 available"
            [Download] [Later] [Details]
            │
            ▼ User clicks "Download"
            │
        Download in Background
            - Progress: 45%
            - Speed: 5 MB/s
            - Non-blocking
            │
            ▼
        Download Complete
            │
            └─→ Show Notification
                "Update ready to install"
                [Install Now] [On Quit]
                │
                ▼ User clicks "Install Now"
                │
            1. Save user state
            2. Stop backend services
            3. Quit application
            4. Install update
            5. Restart application
                │
                ▼
            New version v1.2.0
            - Restore user state
            - Show "What's New"
```

---

## 5. Code Signing Requirements

### macOS

**Required**:
- Apple Developer Account ($99/year)
- Developer ID Application certificate
- Xcode command line tools

**Notarization** (macOS 10.15+):
```bash
export APPLE_ID="your-apple-id@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### Windows

**Required**:
- Code Signing Certificate (DigiCert, Sectigo, etc.)
- Certificate in .pfx format

**GitHub Secrets**:
```
WIN_CSC_LINK=<base64-encoded-pfx>
WIN_CSC_KEY_PASSWORD=<certificate-password>
```

### Linux

- No code signing required
- Optional: Sign .deb and .rpm packages

---

## 6. Release Process

### Version Management

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards-compatible)
- **PATCH**: Bug fixes

### Release Steps

1. **Update version** in `package.json`
2. **Create git tag**: `git tag -a v1.2.3 -m "Release 1.2.3"`
3. **Push tag**: `git push origin v1.2.3`
4. **CI/CD automatically**:
   - Builds all platforms
   - Signs installers
   - Creates GitHub Release
   - Publishes update metadata

### Rollback Strategy

If critical bug discovered:

```bash
# Option 1: Mark as draft (hide from users)
gh release edit v1.2.3 --draft

# Option 2: Delete release
gh release delete v1.2.3 --yes

# Option 3: Release hotfix
git tag -a v1.2.4 -m "Hotfix for v1.2.3"
git push origin v1.2.4
```

---

## 7. User Installation Flow

### First-Time Installation

```
1. Download installer from GitHub Releases
   └─→ Windows: TRII-Platform-Setup-1.0.0.exe
   └─→ macOS: TRII-Platform-1.0.0.dmg
   └─→ Linux: TRII-Platform-1.0.0.AppImage

2. OS Security Verification
   └─→ Verified publisher/developer

3. Installation
   └─→ Windows: Choose directory
   └─→ macOS: Drag to Applications
   └─→ Linux: Make executable

4. First Launch - Setup Wizard
   ├─→ Welcome Screen
   ├─→ System Requirements Check
   │   ├─→ ✅ Memory: 16GB
   │   ├─→ ✅ Disk: 250GB
   │   └─→ ❌ Docker: Not Found
   │       └─→ [Install Docker Desktop]
   │
   ├─→ Docker Verification
   │   └─→ Start backend services
   │
   ├─→ Configuration
   │   └─→ API keys (optional)
   │
   └─→ Setup Complete
       └─→ Launch application

5. Main Application
   └─→ Dashboard with live data
```

---

## 8. Cost Analysis

### Infrastructure Costs (Annual)

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Account | $99/year | Required for macOS |
| Windows Code Signing Cert | $200-400/year | Annual renewal |
| GitHub Releases | Free | Unlimited hosting |
| CI/CD (GitHub Actions) | Free | For public repos |
| **Total** | **~$300/year** | Minimal infrastructure |

### Development Time

| Phase | Hours | Weeks |
|-------|-------|-------|
| Phase 1: Foundation | 46 | 1-2 |
| Phase 2: Build Pipeline | 54 | 1 |
| Phase 3: Auto-Update | 44 | 1 |
| Phase 4: Setup Wizard | 36 | 1 |
| Phase 5: Service Management | 50 | 1 |
| Phase 6: Optimization | 60 | 1 |
| Phase 7: Documentation | 84 | 2 |
| **Total** | **374 hours** | **8 weeks** |

---

## 9. Success Metrics

### KPIs

**Installation**:
- Installer success rate: **>95%**
- Setup completion: **>90%**
- Installation time: **<5 minutes**

**Updates**:
- Update adoption (7 days): **>80%**
- Update success rate: **>98%**
- Update time: **<2 minutes**

**Reliability**:
- Crash rate: **<0.1%**
- Backend uptime: **99.9%**
- Startup time: **<10 seconds**

---

## 10. Next Steps

### Immediate Actions (Week 1)

1. ✅ **Obtain Apple Developer Account**
   - Register at developer.apple.com
   - Cost: $99/year

2. ✅ **Purchase Windows Code Signing Certificate**
   - DigiCert, Sectigo, or similar
   - Cost: $200-400/year

3. ✅ **Create Build Configuration**
   - Set up `electron-builder.json`
   - Configure multi-platform builds

4. ✅ **Implement Backend Manager**
   - Create `BackendManager` class
   - Test Docker integration

### Week 2-8

Follow the implementation roadmap phases outlined above.

---

## 11. Support & Maintenance

### Post-Release

**Monitoring**:
- Crash reporting (Sentry)
- Usage analytics
- Update adoption tracking

**Support Channels**:
- GitHub Issues
- Documentation
- Community forum

**Update Cadence**:
- Patch releases: As needed (bugs)
- Minor releases: Monthly
- Major releases: Quarterly

---

## Conclusion

This plan provides a comprehensive roadmap for creating a professional, installable desktop application. The **Hybrid Docker Desktop Integration** approach offers:

✅ **Professional user experience**
✅ **Minimal infrastructure costs** ($300/year)
✅ **Scalable architecture**
✅ **Easy maintenance and updates**
✅ **Cross-platform support**

**Timeline**: 8 weeks to v1.0.0 release
**Investment**: 374 development hours
**ROI**: Professional distribution platform for growth

---

**Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 (Foundation)
