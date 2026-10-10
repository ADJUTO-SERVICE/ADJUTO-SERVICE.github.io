/* ==========================================================
   N・K works
   script.js
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

/* -----------------------------
   スマホメニュー 開閉
------------------------------*/

const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector("header nav");

menuBtn.addEventListener("click", () => {

    menuBtn.classList.toggle("active");
    nav.classList.toggle("active");
    menuBtn.setAttribute("aria-expanded", nav.classList.contains("active"));
    menuBtn.setAttribute("aria-label", nav.classList.contains("active") ? "メニューを閉じる" : "メニューを開く");

});

/* メニュー項目を押したら閉じる */

nav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

        menuBtn.classList.remove("active");
        nav.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "メニューを開く");

    });

});



    /* -----------------------------
       FAQ 開閉
    ------------------------------*/

    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {

        const question = item.querySelector(".faq-question");

        question.addEventListener("click", () => {

            item.classList.toggle("active");

        });

    });

    /* -----------------------------
       スクロールアニメーション
    ------------------------------*/

    const fadeElements = document.querySelectorAll(
        ".reason-card,.service-card,.price-card,.flow-item,.gallery-card,.faq-item,.contact-box"
    );

    fadeElements.forEach(el=>{
        el.classList.add("fade");
    });

    const observer = new IntersectionObserver((entries)=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                entry.target.classList.add("show");

            }

        });

    },{

        threshold:0.15

    });

    fadeElements.forEach(el=>observer.observe(el));

    /* -----------------------------
       スムーズスクロール
    ------------------------------*/

    document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

        anchor.addEventListener("click",function(e){

            const target=document.querySelector(this.getAttribute("href"));

            if(!target) return;

            e.preventDefault();

            target.scrollIntoView({

                behavior:"smooth"

            });

        });

    });

    /* -----------------------------
       ヘッダー色変更
    ------------------------------*/

    const header=document.querySelector("header");

    window.addEventListener("scroll",()=>{

        if(window.scrollY>80){

            header.style.boxShadow="0 10px 25px rgba(0,0,0,.08)";

            header.style.background="rgba(255,255,255,.98)";

        }else{

            header.style.boxShadow="none";

            header.style.background="rgba(255,255,255,.95)";

        }

    });

    /* -----------------------------
       トップへ戻るボタン
    ------------------------------*/

    const topBtn=document.createElement("button");

    topBtn.innerHTML="↑";

    topBtn.className="top-btn";

    document.body.appendChild(topBtn);

    topBtn.addEventListener("click",()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    });

    window.addEventListener("scroll",()=>{

        if(window.scrollY>500){

            topBtn.classList.add("show");

        }else{

            topBtn.classList.remove("show");

        }

    });

});

