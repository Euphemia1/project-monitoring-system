"use server"

import { Header } from "@/components/dashboard/header"
import { query } from "@/lib/db"

interface Document {
  id: string
  name: string
  type: string
  size: number
  url: string
  project_id: string
  project_name: string
  uploaded_by: string
  uploaded_at: string
  status: 'pending' | 'approved' | 'rejected'
}

export default async function DocumentsPage() {
  try {
    // Fetch documents with related data
    const documents = await query(`
      SELECT 
        d.*,
        p.contract_name as project_name,
        u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.uploaded_at DESC
    `) as Document[]

    // Fetch projects for the filter dropdown
    const projects = await query(`
      SELECT id, contract_name as name 
      FROM projects 
      ORDER BY contract_name
    `)

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Documents"
          description="Manage all project documents"
        />
        <div className="rounded-md border">
          <div className="p-4 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              <div className="w-full sm:w-auto flex gap-2">
                <select className="px-4 py-2 border rounded-md">
                  <option value="">All Projects</option>
                  {Array.isArray(projects) && projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select className="px-4 py-2 border rounded-md">
                  <option value="">All Types</option>
                  <option value="contract">Contract</option>
                  <option value="report">Report</option>
                  <option value="invoice">Invoice</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(documents) && documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {doc.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(doc.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doc.project_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.uploaded_by_name || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : doc.status === 'rejected' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No documents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading documents:', error)
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Documents"
          description="Error loading documents"
        />
        <div className="text-red-500">Failed to load documents. Please try again later.</div>
      </div>
    )
  }
}