import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Plus, Pencil, Trash, BookOpen } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { toast } from "../ui/toastApi"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import { TextField, SelectField } from "../ui/Field"
import { LoadingState, EmptyState, ErrorState } from "../ui/States"

const EMPTY_FORM = {
  code: "",
  name: "",
  semester: "1st",
  school_year: "",
}

const SEMESTERS = [
  { value: "1st", label: "1st Semester" },
  { value: "2nd", label: "2nd Semester" },
  { value: "Summer", label: "Summer" },
]

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentSubject, setCurrentSubject] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [processing, setProcessing] = useState(false)

  const fetchSubjects = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setSubjects(data ?? [])
    } catch (error) {
      setLoadError(error.message || "Subjects could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  // Checked before the insert, so a duplicate never writes a row it then hides.
  const findDuplicate = ({ code, name }, ignoreId) =>
    subjects.find(
      (subject) =>
        subject.id !== ignoreId &&
        (subject.code.trim().toLowerCase() === code.trim().toLowerCase() ||
          subject.name.trim().toLowerCase() === name.trim().toLowerCase())
    )

  const handleAddSubject = async () => {
    const code = formData.code.trim()
    const name = formData.name.trim()

    if (!code || !name) {
      toast.warning("Subject code and name are required.")
      return
    }

    const duplicate = findDuplicate({ code, name }, null)
    if (duplicate) {
      toast.warning(
        duplicate.code.toLowerCase() === code.toLowerCase()
          ? `Subject code ${duplicate.code} is already used by ${duplicate.name}.`
          : `"${duplicate.name}" already exists as ${duplicate.code}.`
      )
      return
    }

    setProcessing(true)
    try {
      const { data, error } = await supabase
        .from("subjects")
        .insert([{ ...formData, code, name }])
        .select()

      if (error) throw error
      if (!data?.[0]) throw new Error("the insert returned no row")

      setSubjects([data[0], ...subjects])
      setIsAddDialogOpen(false)
      resetForm()
      toast.success(`${name} added.`)
    } catch (error) {
      toast.error("Subject was not added: " + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleEditSubject = async () => {
    if (!currentSubject) return

    const code = formData.code.trim()
    const name = formData.name.trim()
    if (!code || !name) {
      toast.warning("Subject code and name are required.")
      return
    }

    const duplicate = findDuplicate({ code, name }, currentSubject.id)
    if (duplicate) {
      toast.warning(
        duplicate.code.toLowerCase() === code.toLowerCase()
          ? `Subject code ${duplicate.code} is already used by ${duplicate.name}.`
          : `"${duplicate.name}" already exists as ${duplicate.code}.`
      )
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from("subjects")
        .update({ ...formData, code, name })
        .eq("id", currentSubject.id)

      if (error) throw error

      setSubjects(
        subjects.map((subject) =>
          subject.id === currentSubject.id ? { ...subject, ...formData, code, name } : subject
        )
      )
      setIsEditDialogOpen(false)
      resetForm()
      toast.success(`${name} updated.`)
    } catch (error) {
      toast.error("Subject was not updated: " + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteSubject = async () => {
    if (!currentSubject) return

    setProcessing(true)
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", currentSubject.id)

      if (error) throw error

      setSubjects(subjects.filter((subject) => subject.id !== currentSubject.id))
      setIsDeleteDialogOpen(false)
      toast.success(`${currentSubject.name} deleted.`)
      resetForm()
    } catch (error) {
      toast.error("Subject was not deleted: " + error.message)
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
      school_year: subject.school_year || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (subject) => {
    setCurrentSubject(subject)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setIsDeleteDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setCurrentSubject(null)
  }

  const subjectFields = (prefix) => (
    <div className="grid gap-4">
      <TextField
        id={`${prefix}code`}
        label="Subject Code"
        required
        placeholder="e.g., CS101"
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
      />
      <TextField
        id={`${prefix}name`}
        label="Subject Name"
        required
        placeholder="e.g., Introduction to Computer Science"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <SelectField
        id={`${prefix}semester`}
        label="Semester"
        value={formData.semester}
        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
      >
        {SEMESTERS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <TextField
        id={`${prefix}school_year`}
        label="School Year"
        placeholder="e.g., 2026-2027"
        value={formData.school_year}
        onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
      />
    </div>
  )

  return (
    <TeacherLayout title="Subjects">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage all subjects in the system
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-5 w-5" aria-hidden="true" />
            Add Subject
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-canvas">
            <h3 className="text-lg font-medium text-gray-900">Subject List</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <LoadingState label="Loading subjects" />
            ) : loadError ? (
              <ErrorState message={loadError} onRetry={fetchSubjects} />
            ) : subjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No subjects found"
                description="Get started by adding a new subject."
                action={
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    Add Subject
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-canvas">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Semester
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        School Year
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-canvas">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {subject.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {subject.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {subject.school_year || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => openEditDialog(subject)}
                              aria-label={`Edit ${subject.name}`}
                              title={`Edit ${subject.name}`}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteDialog(subject)}
                              aria-label={`Delete ${subject.name}`}
                              title={`Delete ${subject.name}`}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                              <Trash className="h-4 w-4" aria-hidden="true" />
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

      <Modal
        open={isAddDialogOpen}
        onClose={closeDialogs}
        title="Add New Subject"
        footer={
          <>
            <Button variant="secondary" onClick={closeDialogs} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSubject}
              disabled={!formData.code.trim() || !formData.name.trim() || processing}
            >
              {processing ? "Adding..." : "Add Subject"}
            </Button>
          </>
        }
      >
        {subjectFields("")}
      </Modal>

      <Modal
        open={isEditDialogOpen}
        onClose={closeDialogs}
        title="Edit Subject"
        description={currentSubject ? `Editing ${currentSubject.name}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={closeDialogs} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubject}
              disabled={!formData.code.trim() || !formData.name.trim() || processing}
            >
              {processing ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        {subjectFields("edit-")}
      </Modal>

      <Modal
        open={isDeleteDialogOpen}
        onClose={closeDialogs}
        title="Delete Subject"
        description={`Delete ${currentSubject?.code} - ${currentSubject?.name}?`}
        footer={
          <>
            <Button variant="secondary" onClick={closeDialogs} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleDeleteSubject} disabled={processing}>
              {processing ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          This cannot be undone. Students keep their records, but this subject disappears
          from their enrolled list.
        </p>
      </Modal>
    </TeacherLayout>
  )
}
