import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { DataWorkspace } from "@/components/common/DataWorkspace";
export const Route = createFileRoute("/list-requests")({ component: Page });
function Page() { return <DataWorkspace title='طلبات القوائم' description='مراجعة القوائم التي أرسلها المستخدمون.' icon={Inbox} table='list_requests' fields={[{ key: 'status', label: 'الحالة', type: "select", options: ['pending', 'approved', 'rejected'], required: true }, { key: 'review_notes', label: 'ملاحظات المراجعة', type: 'textarea', required: false }]} columns={[{ key: 'list_id', label: 'معرف القائمة' }, { key: 'submitted_by', label: 'مقدم الطلب' }, { key: 'status', label: 'الحالة' }, { key: 'submitted_at', label: 'تاريخ الإرسال' }, { key: 'reviewed_at', label: 'تاريخ المراجعة' }]} permission='lists.review' orderBy='submitted_at' softDelete={false} canCreate={false} canDelete={false} filters={['status']} />; }
