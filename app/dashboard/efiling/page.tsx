
import { Header } from "@/components/dashboard/header"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/user"
import { redirect } from "next/navigation"
import { EFilingInterface } from "@/components/documents/efiling-interface"

export default async function EFilingPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect("/auth/login")
    }

    // Fetch projects available to the user
    const projectValues: any[] = []
    let projectsSql = `
    SELECT p.id, p.contract_no, p.contract_name, d.name AS district_name, p.status
    FROM projects p
    LEFT JOIN districts d ON d.id = p.district_id
  `

    // Simplified: Allow all users to see projects, role-based controls are in EFilingInterface
    // if (user.role !== 'director') {
    //     projectsSql += ` WHERE EXISTS (SELECT 1 FROM project_assignments pa WHERE pa.project_id = p.id AND pa.user_id = ?) `
    //     projectValues.push(user.id)
    // }

    projectsSql += ` ORDER BY p.contract_name `
    const projects: any[] = await query(projectsSql, projectValues)

    // Fetch documents
    const docValues: any[] = []
    let docsSql = `
    SELECT 
      d.*,
      u.name as uploader_name,
      p.contract_no as project_contract_no,
      p.contract_name as project_contract_name,
      au.name as assignee_name,
      au.role as assignee_role
    FROM documents d
    LEFT JOIN users u ON u.id = d.uploaded_by
    LEFT JOIN projects p ON p.id = d.project_id
    LEFT JOIN users au ON au.id = d.action_assignee_id
  `

    // Simplified: Allow all users to see documents, role-based controls are in EFilingInterface
    // if (user.role !== 'director') {
    //     docsSql += ` INNER JOIN project_assignments pa ON pa.project_id = d.project_id AND pa.user_id = ? `
    //     docValues.push(user.id)
    // }

    docsSql += ` ORDER BY d.created_at DESC `
    const documents: any[] = await query(docsSql, docValues)

    // Fetch all users for action assignment
    const users: any[] = await query("SELECT id, name, email, role FROM users WHERE is_active = 1 ORDER BY name", [])

    return (
        <div className="flex flex-col min-h-screen">
            <Header
                title="E-filing System"
                subtitle="Manage project correspondence and documentation"
            />

            <div className="p-6">
                <EFilingInterface
                    initialProjects={projects.map(p => ({
                        id: String(p.id),
                        contract_no: p.contract_no,
                        contract_name: p.contract_name,
                        district: { name: p.district_name },
                        status: p.status
                    }))}
                    initialDocuments={documents.map(d => ({
                        ...d,
                        id: String(d.id),
                        project_id: String(d.project_id),
                        file_url: d.url,
                        file_size: d.size,
                        created_at: d.created_at,
                        project: {
                            id: String(d.project_id),
                            contract_no: d.project_contract_no,
                            contract_name: d.project_contract_name
                        },
                        uploader: {
                            full_name: d.uploader_name
                        }
                    }))}
                    users={users.map(u => ({
                        id: String(u.id),
                        name: u.name,
                        email: u.email,
                        role: u.role
                    }))}
                    userRole={user.role as any}
                    userId={String(user.id)}
                />
            </div>
        </div>
    )
}
