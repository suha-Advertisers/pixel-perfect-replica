import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { DataWorkspace } from "@/components/common/DataWorkspace";
export const Route = createFileRoute("/activity")({ component: Page });
function Page() { return <DataWorkspace title='سجل النشاطات' description='مراجعة سجل العمليات المسجلة في النظام.' icon={History} table='audit_logs' fields={[]} columns={[{ key: 'action', label: 'الإجراء' }, { key: 'table_name', label: 'الجدول' }, { key: 'record_id', label: 'معرف السجل' }, { key: 'actor_id', label: 'المستخدم' }, { key: 'created_at', label: 'تاريخ الإنشاء' }]} permission='audit.view' canCreate={false} canEdit={false} softDelete={false} filters={['action', 'table_name']} />; }
