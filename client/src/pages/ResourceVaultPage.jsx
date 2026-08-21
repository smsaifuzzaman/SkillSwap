import {
  Download,
  File,
  FileDown,
  FileText,
  FolderLock,
  Search,
  Trash2,
  Upload
} from "lucide-react";

import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

import {
  deleteVaultResource,
  getMyVaultResources,
  uploadVaultResource
} from "../api/vaultApi.js";

import { parseError } from "../utils/errors.js";

const emptyForm = {
  title: "",
  category: "Learning Material",
  file: null
};

const categories = [
  "All",
  "Notes",
  "Learning Material",
  "Certificate",
  "Portfolio"
];

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

function ResourceVaultPage({ token }) {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResources() {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getMyVaultResources(token);

        setResources(data.resources || []);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, [token]);

  const filteredResources = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesCategory =
        category === "All" ||
        resource.category === category;

      const matchesSearch =
        !searchText ||
        resource.title.toLowerCase().includes(searchText) ||
        resource.originalName.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });
  }, [resources, search, category]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.file) {
      setError("Please choose a file.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await uploadVaultResource(
        token,
        form
      );

      setResources((current) => [
        data.resource,
        ...current
      ]);

      setForm(emptyForm);

      setMessage(
        data.message ||
          "Resource uploaded successfully."
      );

      event.target.reset();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Delete this resource from your vault?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const data = await deleteVaultResource(
        token,
        id
      );

      setResources((current) =>
        current.filter(
          (resource) => resource.id !== id
        )
      );

      setMessage(
        data.message ||
          "Resource deleted."
      );
    } catch (err) {
      setError(parseError(err));
    }
  }
function handleExportPortfolioPdf() {
  const portfolioResources = resources.filter(
    (resource) =>
      resource.category === "Portfolio" ||
      resource.category === "Certificate"
  );

  if (portfolioResources.length === 0) {
    setError(
      "Add at least one Portfolio or Certificate resource before exporting."
    );
    setMessage("");
    return;
  }

  setError("");
  setMessage("");

  const pdf = new jsPDF();

  pdf.setFontSize(22);
  pdf.text("SkillSwap Portfolio", 20, 22);

  pdf.setFontSize(11);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    20,
    31
  );

  pdf.text(
    `Total portfolio resources: ${portfolioResources.length}`,
    20,
    38
  );

  let y = 52;

  portfolioResources.forEach((resource, index) => {
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(14);
    pdf.text(
      `${index + 1}. ${resource.title}`,
      20,
      y
    );

    y += 8;

    pdf.setFontSize(10);

    pdf.text(
      `Category: ${resource.category}`,
      25,
      y
    );

    y += 6;

    const fileText = pdf.splitTextToSize(
      `File: ${resource.originalName}`,
      160
    );

    pdf.text(
      fileText,
      25,
      y
    );

    y += fileText.length * 5 + 2;

    pdf.text(
      `Uploaded: ${formatDate(resource.createdAt)}`,
      25,
      y
    );

    y += 12;
  });

  pdf.save("SkillSwap-Portfolio.pdf");

  setMessage(
    "Portfolio PDF exported successfully."
  );
 }
  return (
    <section className="portfolio-page vault-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">
            Private Resource Storage
          </p>

          <h1>
            Resource Vault
          </h1>

          <p>
            Keep your notes, learning materials,
            certificates, and portfolio files in one
            private workspace.
          </p>
        </div>

        <div className="portfolio-stat vault-stat">
          <FolderLock size={30} />

          <strong>
            {resources.length}
          </strong>

          <span>
            Private Resources
          </span>
        </div>
      </div>

      <div className="vault-layout">
        <form
          className="portfolio-form vault-upload-form"
          onSubmit={handleSubmit}
        >
          <h2>
            Upload Resource
          </h2>

          <label className="field">
            <span>
              Resource title
            </span>

            <input
              type="text"
              value={form.title}
              placeholder="UX Design Notes"
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value
                )
              }
              required
            />
          </label>

          <label className="field">
            <span>
              Category
            </span>

            <select
              value={form.category}
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value
                )
              }
            >
              <option>
                Notes
              </option>

              <option>
                Learning Material
              </option>

              <option>
                Certificate
              </option>

              <option>
                Portfolio
              </option>
            </select>
          </label>

          <label className="field">
            <span>
              File
            </span>

            <label className="upload-dropzone">
              <Upload size={24} />

              <strong>
                {form.file
                  ? form.file.name
                  : "Choose a file"}
              </strong>

              <small>
                PDF, PNG, JPG, TXT, DOC or DOCX
                — maximum 5 MB
              </small>

              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                onChange={(event) =>
                  updateField(
                    "file",
                    event.target.files?.[0] ||
                      null
                  )
                }
              />
            </label>
          </label>

          {error ? (
            <p className="form-error">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="form-note">
              {message}
            </p>
          ) : null}

          <button
            className="primary-button full"
            type="submit"
            disabled={saving}
          >
            <Upload size={18} />

            {saving
              ? "Uploading..."
              : "Upload to Vault"}
          </button>
        </form>

        <section className="portfolio-feed vault-feed">
           <div className="feed-heading">
             <h2>
               My Vault
             </h2>

             <div className="vault-heading-actions">
               <span>
                 {filteredResources.length} item(s)
               </span>

               <button
                 className="ghost-button"
                 type="button"
                 onClick={handleExportPortfolioPdf}
               >
                 <FileDown size={16} />
                 Export Portfolio PDF
               </button>
             </div>
           </div>

          <div className="vault-tools">
            <label className="vault-search">
              <Search size={17} />

              <input
                type="text"
                value={search}
                placeholder="Search resources..."
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              {categories.map(
                (item) => (
                  <option
                    value={item}
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          {loading ? (
            <p>
              Loading your vault...
            </p>
          ) : null}

          {!loading &&
          filteredResources.length === 0 ? (
            <div className="empty-state">
              <FolderLock size={30} />

              <strong>
                No resources found
              </strong>

              <span>
                Upload your first private resource
                or change the current filter.
              </span>
            </div>
          ) : null}

          <div className="vault-resource-list">
            {filteredResources.map(
              (resource) => (
                <article
                  className="vault-resource-card"
                  key={resource.id}
                >
                  <div className="vault-file-icon">
                    {resource.fileType ===
                    "application/pdf" ? (
                      <FileText size={25} />
                    ) : (
                      <File size={25} />
                    )}
                  </div>

                  <div className="vault-resource-copy">
                    <span className="match-label">
                      {resource.category}
                    </span>

                    <h3>
                      {resource.title}
                    </h3>

                    <p>
                      {resource.originalName}
                    </p>

                    <small>
                      {formatFileSize(
                        resource.fileSize
                      )}
                      {" • "}
                      {formatDate(
                        resource.createdAt
                      )}
                    </small>
                  </div>

                  <div className="vault-resource-actions">
                    <a
                      className="ghost-button"
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={16} />
                      Open
                    </a>

                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() =>
                        handleDelete(
                          resource.id
                        )
                      }
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export default ResourceVaultPage;