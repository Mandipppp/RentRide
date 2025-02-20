import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Navigation from "./Navigation";
import Footer from "./Footer";

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
    <div className="bg-pink-50 min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-grow mx-auto p-6 w-full max-w-4xl">
            <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">{page.title}</h1>
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
    
        <Footer />
    </div>
  );
};

export default PageView;
