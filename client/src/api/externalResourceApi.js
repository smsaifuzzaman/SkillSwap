export async function searchLearningBooks(query) {
  const searchText = query.trim();

  if (!searchText) {
    return [];
  }

  const params = new URLSearchParams({
    q: searchText,
    limit: "15",
    fields: "key,title,author_name,first_publish_year"
  });

  const response = await fetch(
    `https://openlibrary.org/search.json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Could not load external learning resources.");
  }

  const data = await response.json();

  return (data.docs || []).map((book) => ({
    key: book.key,
    title: book.title || "Untitled",
    author: book.author_name?.[0] || "Unknown author",
    year: book.first_publish_year || "Unknown year",
    url: book.key
      ? `https://openlibrary.org${book.key}`
      : "https://openlibrary.org"
  }));
}