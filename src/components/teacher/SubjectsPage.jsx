"use client"

import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Plus, Pencil, Trash, Loader2, BookOpen } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import toastr from 'toastr'
import 'toastr/build/toastr.min.css'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentSubject, setCurrentSubject] = useState(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    semester: "1st",
    school_year: "",
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Configure toastr
  toastr.options = {
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    progressBar: true,
    timeOut: 3000
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setSubjects(data)
      } catch (error) {
        toastr.error("Failed to fetch subjects: " + error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleAddSubject = async () => {
    if (!formData.code || !formData.name) {
      toastr.warning("Please fill in all required fields")
      return
    }

    setProcessing(true)
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([formData])
        .select()

      if (error) throw error

      setSubjects([data[0], ...subjects])
      setIsAddDialogOpen(false)
      resetForm()
      toastr.success("Subject added successfully")
    } catch (error) {
      toastr.error("Error adding subject: " + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleEditSubject = async () => {
    if (!currentSubject) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('subjects')
        .update(formData)
        .eq('id', currentSubject.id)

      if (error) throw error

      const updatedSubjects = subjects.map((subject) =>
        subject.id === currentSubject.id ? { ...subject, ...formData } : subject
      )
      setSubjects(updatedSubjects)
      setIsEditDialogOpen(false)
      resetForm()
      toastr.success("Subject updated successfully")
    } catch (error) {
      toastr.error("Error updating subject: " + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteSubject = async () => {
    if (!currentSubject) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', currentSubject.id)

      if (error) throw error

      const updatedSubjects = subjects.filter((subject) => subject.id !== currentSubject.id)
      setSubjects(updatedSubjects)
      setIsDeleteDialogOpen(false)
      toastr.success("Subject deleted successfully")
    } catch (error) {
      toastr.error("Error deleting subject: " + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const openEditDialog = (subject) => {
    setCurrentSubject(subject)
    setFormData({
      code: subject.code,
      name: subject.name,
      semester: subject.semester,
      school_year: subject.school_year,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (subject) => {
    setCurrentSubject(subject)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      semester: "1st",
      school_year: "",
    })
    setCurrentSubject(null)
  }

  return (
    <TeacherLayout title="Subjects">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subject Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all subjects in the system
            </p>
          </div>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Subject
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Subject List</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading subjects...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new subject.
                </p>
                <button
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Subject
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School Year
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subject.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subject.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subject.school_year || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openEditDialog(subject)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-gray-100"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(subject)}
                              className="text-gray-500 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100"
                              title="Delete"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Subject Modal */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Add New Subject</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CS101"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    id="semester"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 bg-white"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  >
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="school_year" className="block text-sm font-medium text-gray-700 mb-1">
                    School Year
                  </label>
                  <input
                    id="school_year"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={formData.school_year}
                    onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                    placeholder="e.g., 2023-2024"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                onClick={handleAddSubject}
                disabled={!formData.code || !formData.name || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                    Adding...
                  </>
                ) : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Edit Subject</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4">
                <div>
                  <label htmlFor="edit-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="edit-semester" className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    id="edit-semester"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 bg-white"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  >
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-school_year" className="block text-sm font-medium text-gray-700 mb-1">
                    School Year
                  </label>
                  <input
                    id="edit-school_year"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={formData.school_year}
                    onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                onClick={handleEditSubject}
                disabled={!formData.code || !formData.name || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Delete Subject</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <span className="font-medium">{currentSubject?.name}</span>? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  onClick={handleDeleteSubject}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                      Deleting...
                    </>
                  ) : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  )
}