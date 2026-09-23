import { useEffect, useState } from "react";

const emptyForm = { name: "", description: "" };

function CollectionsForm({
  busy,
  collection,
  errorMessage,
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const editing = Boolean(collection);

  useEffect(() => {
    setForm(
      collection
        ? { name: collection.name, description: collection.description || "" }
        : emptyForm,
    );
  }, [collection]);

  const inputHandler = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const formSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={formSubmit}>
      <fieldset>
        {errorMessage && <span className="error-messages">{errorMessage}</span>}

        <fieldset className="form-group">
          <input
            className="form-control"
            name="name"
            onChange={inputHandler}
            placeholder="Collection name"
            required
            value={form.name}
          />
        </fieldset>

        <fieldset className="form-group">
          <input
            className="form-control"
            name="description"
            onChange={inputHandler}
            placeholder="Description (optional)"
            value={form.description}
          />
        </fieldset>

        <div className="pull-xs-right">
          {editing && (
            <>
              <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={onCancel}
                type="button"
              >
                Cancel
              </button>{" "}
            </>
          )}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "Saving..." : editing ? "Save Changes" : "Create Collection"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

export default CollectionsForm;
