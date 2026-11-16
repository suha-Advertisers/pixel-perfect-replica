import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { DataWorkspace } from "@/components/common/DataWorkspace";
export const Route=createFileRoute("/trash")({component:TrashPage});
function TrashPage(){return <DataWorkspace title="سلة المحذوفات" description="استعادة المعلنين المحذوفين مؤقتاً." icon={Trash2} table="advertisers" fields={[]} columns={[{key:"full_name",label:"الاسم"},{key:"username",label:"اسم المستخدم"},{key:"city",label:"المدينة"},{key:"deleted_at",label:"تاريخ الحذف"}]} permission="trash.manage" trashMode canCreate={false} canEdit={false}/>;}
