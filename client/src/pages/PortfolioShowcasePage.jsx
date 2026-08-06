import { BriefcaseBusiness, ExternalLink, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { createPortfolioItem, deletePortfolioItem, getMyPortfolioItems } from "../api/portfolioApi.js";
import { parseError } from "../utils/errors.js";

const emptyForm = {
  title: "",
  skill: "",
  description: "",
  projectUrl: "",
  imageUrl: "",
  tags: "",
  visibility: "public"
};

function PortfolioShowcasePage({ token }) {
  const [form, setForm] = useState(emptyForm);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPortfolioItems() {
      try {
        setLoading(true);
        const data = await getMyPortfolioItems(token);
        setPortfolioItems(data.portfolioItems);
      } catch (error) {
        setMessage(parseError(error));
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioItems();
  }, [token]);

  const visibleCount = useMemo(
    () => portfolioItems.filter((item) => item.visibility === "public").length,
    [portfolioItems]
  );

  function updateField(field, value) {
    // This helper makes live modification easier: change one field name here and every input stays simple.
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // The payload keys match the PortfolioItem model fields in the backend.
      const data = await createPortfolioItem(token, form);
      setPortfolioItems((current) => [data.portfolioItem, ...current]);
      setForm(emptyForm);
      setMessage("Portfolio item added to MongoDB.");
    } catch (error) {
      setMessage(parseError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setMessage("");

    try {
      await deletePortfolioItem(token, id);
      setPortfolioItems((current) => current.filter((item) => item.id !== id));
      setMessage("Portfolio item deleted.");
    } catch (error) {
      setMessage(parseError(error));
    }
  }

  return (
    <section className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">Portfolio & Feed</p>
          <h1>Skill Portfolio Showcase</h1>
          <p>
            Add portfolio work linked to skills you can teach. These records are saved in MongoDB
            under the `portfolioitems` collection.
          </p>
        </div>

        <div className="portfolio-stat">
          <BriefcaseBusiness size={28} />
          <strong>{portfolioItems.length}</strong>
          <span>{visibleCount} public items</span>
        </div>
      </div>

      <div className="portfolio-layout">
        <form className="portfolio-form" onSubmit={handleSubmit}>
          <h2>Add portfolio item</h2>

          <label className="field">
            <span>Project title</span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="React landing page redesign"
              required
            />
          </label>

          <label className="field">
            <span>Linked skill</span>
            <input
              value={form.skill}
              onChange={(event) => updateField("skill", event.target.value)}
              placeholder="React, Figma, English speaking"
              required
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Explain what you built and why it proves this skill."
              required
            />
          </label>

          <label className="field">
            <span>Project link</span>
            <input
              type="url"
              value={form.projectUrl}
              onChange={(event) => updateField("projectUrl", event.target.value)}
              placeholder="https://github.com/your-project"
            />
          </label>

          <label className="field">
            <span>Image link</span>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) => updateField("imageUrl", event.target.value)}
              placeholder="https://example.com/project-screenshot.png"
            />
          </label>

          <label className="field">
            <span>Tags</span>
            <input
              value={form.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="frontend, ui, beginner"
            />
          </label>

          <label className="field">
            <span>Visibility</span>
            <select value={form.visibility} onChange={(event) => updateField("visibility", event.target.value)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>

          {message ? <p className="form-note">{message}</p> : null}

          <button className="primary-button full" type="submit" disabled={saving}>
            <Plus size={18} />
            {saving ? "Saving..." : "Add to showcase"}
          </button>
        </form>

        <div className="portfolio-feed">
          <div className="feed-heading">
            <h2>My showcase feed</h2>
            <span>{loading ? "Loading..." : `${portfolioItems.length} item(s)`}</span>
          </div>

          {!loading && portfolioItems.length === 0 ? (
            <div className="empty-state">
              <strong>No portfolio items yet.</strong>
              <span>Add your first item using the form.</span>
            </div>
          ) : null}

          {portfolioItems.map((item) => (
            <article className="portfolio-card" key={item.id}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={`${item.title} preview`} />
              ) : (
                <div className="portfolio-image-fallback">
                  <BriefcaseBusiness size={34} />
                </div>
              )}

              <div className="portfolio-card-body">
                <div className="portfolio-card-top">
                  <span>{item.skill}</span>
                  <small>{item.visibility}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <div className="tag-row">
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="portfolio-actions">
                  {item.projectUrl ? (
                    <a className="ghost-button" href={item.projectUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={16} />
                      Open
                    </a>
                  ) : null}
                  <button className="ghost-button danger" type="button" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PortfolioShowcasePage;
