"use client";
import { Search, ShoppingBag, Bell, Heart } from "lucide-react";

const navLinks = ["New In", "Trending", "Collections", "Sale", "Blog"];

export default function Navbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #ff6bb5, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 900, color: "white" }}>G</span>
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              background: "linear-gradient(135deg, #ff6bb5 0%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px",
            }}
          >
            GLAMUP
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex" style={{ gap: 28, alignItems: "center" }}>
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              style={{
                color: "#555",
                fontWeight: 500,
                fontSize: 14,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.target.style.color = "#7c3aed")}
              onMouseLeave={e => (e.target.style.color = "#555")}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Search - Desktop */}
        <div
          className="hidden md:flex"
          style={{
            flex: 1,
            maxWidth: 300,
            alignItems: "center",
            gap: 10,
            background: "#f5f5f7",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: "8px 14px",
          }}
        >
          <Search size={15} color="#999" />
          <input
            placeholder="Search styles..."
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#111",
              fontSize: 14,
              flex: 1,
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Action Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="md:hidden" style={iconBtn}>
            <Search size={18} color="#555" />
          </button>
          <button style={iconBtn}>
            <Bell size={18} color="#555" />
          </button>
          <button style={iconBtn}>
            <Heart size={18} color="#555" />
          </button>
          <button
            style={{
              ...iconBtn,
              background: "linear-gradient(135deg, #ff6bb5, #7c3aed)",
              position: "relative",
            }}
          >
            <ShoppingBag size={18} color="white" />
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#fbbf24",
                color: "#000",
                fontSize: 9,
                fontWeight: 800,
                borderRadius: 99,
                padding: "0 5px",
                lineHeight: "15px",
              }}
            >
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

const iconBtn = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: "#f5f5f7",
  border: "1px solid #e5e5e5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
