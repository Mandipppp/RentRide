import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";

const PageView = () => {
  const { slug } = useParams(); // Get the page slug from the URL
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    axios
      .get(`http://localhost:3000/api/admin/page/getpagebyslug/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPage(res.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching page:", error);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <p>Loading...</p>;

  if (!page) return <p>Page not found.....</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
};

export default PageView;
