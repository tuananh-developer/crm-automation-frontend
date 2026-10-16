# AI CRM Automation System — Frontend Web Application

<p align="center">
  <img src="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png" width="90" alt="Next.js Logo" />
</p>

<p align="center">
  <b>Giao diện Web Ứng dụng Quản trị và Tự động hóa CRM thông minh</b><br>
  Xây dựng trên nền tảng <b>Next.js 15+ (App Router)</b>, <b>React 19</b>, <b>TailwindCSS v4</b>, <b>Radix UI / Shadcn</b> và <b>TanStack React Query</b>.
</p>

---

## 📌 1. Giới thiệu tổng quan

**CRM Automation Frontend** là phân hệ giao diện người dùng trực quan, hiện đại được thiết kế dành riêng cho nhân viên kinh doanh (Sales Reps) và cấp quản lý (Admins/Managers). Ứng dụng cung cấp bảng điều khiển trung tâm giúp theo dõi toàn diện phễu khách hàng tiềm năng, tương tác với các phân tích AI theo thời gian thực (Đánh giá sơ bộ, Làm giàu dữ liệu, Chấm điểm tiềm năng), thiết kế chuỗi kịch bản chăm sóc khách hàng đa bước và duyệt xét các tác vụ thông minh (Human-in-the-Loop).

---

## 🚀 2. Công nghệ cốt lõi

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server & Client Components, TypeScript 5).
- **Thư viện UI**: [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons.
- **Quản lý State & Server Cache**: [TanStack React Query v5](https://tanstack.com/query/latest) giúp tự động refetch, optimistic updates và đồng bộ dữ liệu API mượt mà.
- **HTTP Client**: [Axios](https://axios-http.com/) với interceptors tự động đính kèm Bearer JWT Token và xử lý lỗi đồng nhất.
- **Form & Validation**: [React Hook Form](https://react-hook-form.com/) kết hợp [Zod](https://zod.dev/) schema validation.
- **Phong cách thiết kế**: Clean Enterprise Dashboard, Dark/Light theme ready, Responsive thích ứng mọi độ phân giải màn hình.

---

## 🖥️ 3. Các phân hệ chức năng chính

### 1. 📊 Executive Dashboard (`/`)
- Tổng hợp các chỉ số KPI theo thời gian thực: Tổng số Leads, Tỷ lệ chuyển đổi khách hàng, Số lượng Lead tiềm năng cao (`HOT`), Số lượng chuỗi kịch bản đang chạy.
- Phân bố trạng thái phễu Lead (New $\rightarrow$ Qualifying $\rightarrow$ Qualified $\rightarrow$ Converted $\rightarrow$ Lost).
- Lối tắt tác vụ nhanh (Tạo Lead, Rà soát tác vụ cần duyệt, Quét dọn dữ liệu).

### 2. 👥 Quản lý Khách hàng tiềm năng (`/leads`)
- **Bảng dữ liệu Lead**: Hỗ trợ tìm kiếm từ khóa, phân trang, lọc nâng cao theo Nguồn Lead (Lead Sources), Chủ sở hữu (Owner) và Trạng thái vòng đời.
- **Thêm mới Lead**: Form Drawer tiện lợi với cơ chế tự động chọn nguồn khả dụng đầu tiên.
- **Trang chi tiết Lead**:
  - Huy hiệu **AI Qualification** (BANT/CHAMP score, lý do phân loại).
  - Đồng hồ đo **AI Lead Score** (Thang 0-100, nhãn HOT/WARM/COLD kèm các yếu tố giải thích).
  - Khối **AI Company Enrichment** (Thông tin doanh nghiệp, website, quy mô, liên hệ LinkedIn).
  - Dòng thời gian lịch sử tương tác (Interactions timeline).
  - Nút chuyển đổi Lead sang Khách hàng chính thức (**Convert to Customer**).

### 3. ⚡ Chuỗi kịch bản chăm sóc khách hàng (`/follow-ups`)
- **Trình tạo kịch bản trực quan (Sequence Builder)**: Thiết lập chuỗi các bước (Steps) gửi Email, SMS hoặc Webhook với độ trễ tùy biến (Delay minutes/hours).
- **Ghi danh Lead (Enrollment)**: Gắn Lead vào kịch bản nuôi dưỡng phù hợp, có cơ chế chống ghi danh trùng lặp.
- **Lịch sử thực thi (Execution History)**: Theo dõi trạng thái từng bước (`PENDING`, `RUNNING`, `SUCCESS`, `FAILED`, `RETRYING`), mã tin nhắn và nhật ký lỗi.

### 4. 💼 Quản lý Khách hàng & Phân khúc (`/customers`, `/segments`)
- Danh bạ khách hàng đã chuyển đổi, bảo mật tuyệt đối không để lộ dữ liệu nhạy cảm.
- Bộ tạo phân khúc theo quy tắc động (Dynamic JSON Rules: quy mô công ty, doanh thu, ngành nghề) và kích hoạt đánh giá phân khúc tự động.

### 5. 📬 Hộp thư duyệt xét AI (`/review`)
- Trung tâm **Human-in-the-Loop Review**: Nơi các Lead có độ tự tin AI thấp ($< 0.80$) hoặc có ngoại lệ cần phê duyệt của con người.
- Nhân viên có thể đưa ra quyết định: **APPROVE**, **REJECT** hoặc **MODIFY** kèm nhận xét phản hồi.
- Tích hợp chuông thông báo (Notifications) theo thời gian thực.

### 6. 🧹 AI CRM Data Cleaning Studio (`/data-cleaning`)
- Quét toàn diện cơ sở dữ liệu CRM để phát hiện các trường hợp dữ liệu rác, lỗi format:
  - Email sai cú pháp hoặc dùng tên miền tạm.
  - Số điện thoại thiếu mã quốc gia hoặc sai độ dài.
  - Họ tên bị dính ký tự lạ, khoảng trắng thừa hoặc lỗi viết hoa.
- Báo cáo phân tích bất thường trực quan và nút **Áp dụng chuẩn hóa** (Apply Fixes) một chạm.

---

## 📁 4. Cấu trúc thư mục

```text
crm-automation-frontend/
├── app/                       # Next.js App Router Pages
│   ├── customers/             # Quản lý khách hàng
│   ├── data-cleaning/         # Phân hệ AI Data Cleaning Agent
│   ├── follow-ups/            # Quản lý kịch bản chăm sóc & thực thi
│   ├── leads/                 # Quản lý danh sách & chi tiết Lead
│   ├── review/                # Hộp thư duyệt xét con người (Human Review)
│   ├── segments/              # Phân khúc khách hàng tự động
│   ├── layout.tsx             # Root Layout (Sidebar, Topbar, QueryClient Provider)
│   └── page.tsx               # Executive Dashboard chính
├── components/                # Reusable UI Components (Buttons, Dialogs, Tables, Cards)
├── hooks/                     # Custom React Hooks (useLeads, useFollowUps, v.v.)
├── lib/                       # Utility functions, axios client setup
├── services/                  # API Service layer gọi Backend NestJS
├── types/                     # TypeScript definitions đồng bộ với Backend
├── public/                    # Static Assets (Logos, Icons)
├── package.json
└── tsconfig.json
```

---

## 🛠️ 5. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu tiên quyết:
- **Node.js**: >= 20.x
- **Package Manager**: `pnpm` (khuyên dùng)
- **Backend Service**: Đang chạy tại `http://localhost:3000`

### Bước 1: Cài đặt Dependencies
```bash
pnpm install
```

### Bước 2: Cấu hình Biến môi trường (`.env.local`)
Tạo file `.env.local` tại thư mục gốc frontend:
```env
# Địa chỉ URL của Backend NestJS
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Hoặc Backend nội bộ khi gọi SSR
BACKEND_INTERNAL_URL=http://localhost:3000/api
```

### Bước 3: Khởi động Development Server
```bash
pnpm dev
```
Mở trình duyệt và truy cập: **`http://localhost:3001`** (hoặc `http://localhost:3000` nếu cổng 3000 chưa bị chiếm bởi backend).

### Bước 4: Kiểm tra Linting & Build Production
```bash
# Kiểm tra linting
pnpm lint

# Build bản phát hành production
pnpm build

# Khởi chạy production server
pnpm start
```

---

## 🔐 6. Tài khoản Demo kiểm thử

Đăng nhập bằng các tài khoản mẫu của hệ thống:
- **Admin**: `admin@crm.local` / `Password123!`
- **Sales Rep**: `sales@crm.local` / `Password123!`

---

## 📄 7. Bản quyền & Đóng góp
Dự án được xây dựng và duy trì bởi nhóm phát triển AI CRM Automation.
Mọi thắc mắc hoặc đề xuất tính năng vui lòng gửi Pull Request hoặc liên hệ qua kênh trao đổi nội bộ của nhóm.
