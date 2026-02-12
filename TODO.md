# QA RCA Governance - MVP-1 Build Progress

## Phase 1: Project Scaffolding & Data Layer
- [ ] 1. package.json
- [ ] 2. tsconfig.json
- [ ] 3. next.config.js
- [ ] 4. tailwind.config.ts
- [ ] 5. postcss.config.js
- [ ] 6. .env.example
- [ ] 7. prisma/schema.prisma
- [ ] 8. prisma/seed.ts
- [ ] 9. src/app/globals.css

## Phase 2: Core Libraries & Auth
- [ ] 10. src/lib/prisma.ts
- [ ] 11. src/lib/auth.ts (NextAuth config)
- [ ] 12. src/lib/permissions.ts
- [ ] 13. src/lib/utils.ts
- [ ] 14. src/lib/similarity.ts
- [ ] 15. src/lib/audit.ts
- [ ] 16. src/types/index.ts

## Phase 3: UI Components
- [ ] 17. shadcn/ui components (button, input, select, badge, dialog, table, card, textarea, tabs, dropdown-menu, toast, separator, sheet, label, avatar)
- [ ] 18. src/components/layout/sidebar.tsx
- [ ] 19. src/components/layout/header.tsx
- [ ] 20. src/components/layout/app-shell.tsx
- [ ] 21. src/components/providers.tsx (session provider)

## Phase 4: Auth & Root Pages
- [ ] 22. src/app/api/auth/[...nextauth]/route.ts
- [ ] 23. src/app/login/page.tsx
- [ ] 24. src/app/layout.tsx
- [ ] 25. src/app/page.tsx (redirect)

## Phase 5: Dashboard
- [ ] 26. src/app/dashboard/page.tsx
- [ ] 27. src/app/api/dashboard/route.ts

## Phase 6: RCA Library
- [ ] 28. src/app/api/codes/route.ts (GET approved codes)
- [ ] 29. src/app/api/codes/[id]/route.ts (GET single code)
- [ ] 30. src/app/api/codes/export/route.ts (CSV export)
- [ ] 31. src/app/api/codes/similar/route.ts (duplicate detection)
- [ ] 32. src/app/library/page.tsx
- [ ] 33. src/app/library/[id]/page.tsx

## Phase 7: Proposals
- [ ] 34. src/app/api/proposals/route.ts (GET list, POST create)
- [ ] 35. src/app/api/proposals/[id]/route.ts (GET detail)
- [ ] 36. src/app/api/proposals/[id]/decision/route.ts (POST decision)
- [ ] 37. src/app/api/proposals/[id]/comments/route.ts (GET/POST comments)
- [ ] 38. src/app/proposals/page.tsx
- [ ] 39. src/app/proposals/new/page.tsx
- [ ] 40. src/app/proposals/[id]/page.tsx

## Phase 8: Admin
- [ ] 41. src/app/api/users/route.ts (GET list, POST create)
- [ ] 42. src/app/api/users/[id]/route.ts (GET/PUT single user)
- [ ] 43. src/app/api/audit-logs/route.ts
- [ ] 44. src/app/admin/users/page.tsx
- [ ] 45. src/app/admin/audit-log/page.tsx

## Phase 9: Final
- [ ] 46. README.md
- [ ] 47. middleware.ts (route protection)
