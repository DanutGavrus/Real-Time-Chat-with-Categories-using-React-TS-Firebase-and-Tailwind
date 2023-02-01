import { cloneElement, useCallback, useState } from "react";
import { useRef, useEffect, useLayoutEffect } from "react";
import Category from "./Category";
import { useCollection } from "react-firebase-hooks/firestore";
import { firestore } from "../../scripts/firebase";
import { query, collection, orderBy } from "firebase/firestore";

export default function CategoriesList({ searchText, setChatHeader, setCurrentCategoryId }) {
  const [categoriesListCollection, loading, error] = useCollection(query(collection(firestore, "categoriesList"), orderBy("timestamp")));
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesFiltered, setCategoriesFiltered] = useState([]);

  const scrollDownBtn = useRef();
  const lastCategoryRef = useRef();
  const scrollUpBtn = useRef();
  const firstCategoryRef = useRef();
  const categoriesListRef = useRef();

  useEffect(() => {
    if (categoriesListCollection?.docs?.length > 0) {
      setCategoriesList(categoriesListCollection.docs.map((doc) => {
        return { id: doc.id, ...doc.data() }
      }));
    }
  }, [categoriesListCollection]);

  useEffect(() => {
    if (searchText?.length > 0) {
      setCategoriesFiltered(categoriesList?.filter(category => category.title.toLowerCase().includes(searchText.toLowerCase())));
    } else {
      setCategoriesFiltered(categoriesList);
    }
  }, [searchText, categoriesList]);

  const manageScrollBtnsVisibility = useCallback(() => {
    // Categories overflow
    if (categoriesListRef.current?.scrollHeight > categoriesListRef.current?.clientHeight) {
      // Scrolled to bottom
      if (categoriesListRef.current?.scrollHeight - Math.ceil(categoriesListRef.current?.scrollTop) <= categoriesListRef.current?.clientHeight) {
        toggleScrollBtnVisibility("bottom");
      }
      else if (categoriesListRef.current?.scrollTop === 0) {
        toggleScrollBtnVisibility("top");
      }
    }
    else {
      toggleScrollBtnVisibility("none");
    }
  }, []);

  useLayoutEffect(() => {
    manageScrollBtnsVisibility();

    window.addEventListener("resize", manageScrollBtnsVisibility);
    return () => {
      window.removeEventListener("resize", manageScrollBtnsVisibility);
    };
  }, [manageScrollBtnsVisibility, categoriesFiltered]);

  const toggleScrollBtnVisibility = (position) => {
    if (position === "bottom") {
      scrollDownBtn.current?.classList.add("invisible");
      scrollUpBtn.current?.classList.remove("invisible");
    }
    else if (position === "top") {
      scrollUpBtn.current?.classList.add("invisible");
      scrollDownBtn.current?.classList.remove("invisible");
    }
    else if (position === "none") {
      scrollUpBtn.current?.classList.add("invisible");
      scrollDownBtn.current?.classList.add("invisible");
    }
  };

  const scrollCategoriesBottom = () => {
    toggleScrollBtnVisibility("bottom");
    lastCategoryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollCategoriesTop = () => {
    toggleScrollBtnVisibility("top");
    firstCategoryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {loading && !error && <p className="mt-6 px-3 text-center">Loading...</p>}
      {!loading && error && <p className="mt-6 px-3 text-center">Something went wrong. Please check your internet connection or try again later.</p>}
      {!loading && !error &&
        <>
          <button ref={scrollUpBtn} onClick={scrollCategoriesTop} className="h-6 invisible font-mono">{"↑"}</button>
          {categoriesFiltered?.length > 0 &&
            <ul ref={categoriesListRef} onScroll={manageScrollBtnsVisibility} className="scrollbar-hide overflow-y-scroll">
              {categoriesFiltered?.map((category, i, { length }) => {
                let categoryComponent = <Category key={category.id} id={category.id} category={category} setChatHeader={setChatHeader} setCurrentCategoryId={setCurrentCategoryId} />;
                if (i === 0) {
                  categoryComponent = cloneElement(categoryComponent, { innerRef: firstCategoryRef, first: true });
                }
                if (i === length - 1) {
                  categoryComponent = cloneElement(categoryComponent, { innerRef: lastCategoryRef, last: true });
                }
                return categoryComponent;
              })}
            </ul>
          }
          {categoriesFiltered?.length === 0 && <p className="mt-6 px-3 text-center">Sorry, there is no matching category name for this search.</p>}
          <button ref={scrollDownBtn} onClick={scrollCategoriesBottom} className="h-6 invisible font-mono">{"↓"}</button>
        </>
      }
    </>
  );
}
