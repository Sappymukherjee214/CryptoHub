import React, { useEffect, useMemo, useState } from "react";
import "./contributors.css"; 

const OWNER = "KaranUnique";
const REPO = "CryptoHub";

// Project Admin Config
const PROJECT_ADMIN = {
  username: "KaranUnique",
  repo: "CryptoHub",
  repoUrl: "https://github.com/KaranUnique/CryptoHub",
  githubUrl: "https://github.com/KaranUnique",
  avatarUrl: `https://avatars.githubusercontent.com/KaranUnique?v=4&s=200`, 
  description: "Project Creator & Lead Maintainer"
};

// Points per level
const LEVEL_POINTS = {
  1: 2,
  2: 5,
  3: 11,
};

const getLevelFromPr = (pr) => {
  const title = pr.title?.toLowerCase() || "";
  const titleMatch = title.match(/level[\s-]*(1|2|3)/);
  if (titleMatch) {
    return Number(titleMatch[1]);
  }

  if (Array.isArray(pr.labels)) {
    for (const label of pr.labels) {
      const name = (label?.name || "").toLowerCase();
      const labelMatch = name.match(/level[\s-]*(1|2|3)/);
      if (labelMatch) return Number(labelMatch[1]);
    }
  }

  return null;
};

const getRankFromPoints = (points) => {
  if (points >= 30) return "Gold 🥇";
  if (points >= 20) return "Silver 🥈";
  if (points >= 10) return "Bronze 🥉";
  return "Contributor";
};

const Contributors = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("most_points");
  const [selectedRankFilter, setSelectedRankFilter] = useState("all");
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  //  PUBLIC FETCH - NO TOKEN NEEDED
  useEffect(() => {
    const fetchAllMergedPRs = async () => {
      setLoading(true);
      setError("");

      try {
        let page = 1;
        const perPage = 100;
        let mergedPrs = [];
        let keepFetching = true;

        // Fetch all pages of closed PRs (public GitHub API)
        while (keepFetching) {
          const url = `https://api.github.com/repos/${OWNER}/${REPO}/pulls?state=closed&per_page=${perPage}&page=${page}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.github+json',
              'User-Agent': 'CryptoHub-Contributors-App',
            },
          });

          if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status}`);
          }

          const data = await response.json();
          const merged = data.filter((pr) => pr.merged_at);
          mergedPrs = mergedPrs.concat(merged);

          if (data.length < perPage) {
            keepFetching = false;
          } else {
            page += 1;
          }
        }

        const contributorsMap = {};

        mergedPrs.forEach((pr) => {
          const user = pr.user;
          if (!user) return;

          const username = user.login;
          const avatar_url = user.avatar_url;
          const html_url = user.html_url;

          const level = getLevelFromPr(pr);
          const points = level ? LEVEL_POINTS[level] || 0 : 0;

          if (!contributorsMap[username]) {
            contributorsMap[username] = {
              username,
              avatar_url,
              html_url,
              totalPoints: 0,
              totalPRs: 0,
              rank: "Contributor",
              prs: [],
            };
          }

          contributorsMap[username].totalPRs += 1;
          contributorsMap[username].totalPoints += points;
          contributorsMap[username].prs.push({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            html_url: pr.html_url,
            merged_at: pr.merged_at,
            level,
            points,
          });
        });

        const contributorsArr = Object.values(contributorsMap).map((c) => ({
          ...c,
          rank: getRankFromPoints(c.totalPoints),
        }));

        setContributors(contributorsArr);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMergedPRs();
  }, []);

  const filteredContributors = useMemo(() => {
    let result = [...contributors];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) =>
        c.username.toLowerCase().includes(q)
      );
    }

    if (selectedRankFilter !== "all") {
      const rankMap = {
        gold: "Gold",
        silver: "Silver",
        bronze: "Bronze",
        contributor: "Contributor",
      };
      const selectedRank = rankMap[selectedRankFilter];
      result = result.filter((c) => c.rank === selectedRank);
    }

    if (sortBy === "most_points") {
      result.sort((a, b) => b.totalPoints - a.totalPoints);
    } else if (sortBy === "most_prs") {
      result.sort((a, b) => b.totalPRs - a.totalPRs);
    }

    return result;
  }, [contributors, search, selectedRankFilter, sortBy]);

  const handleOpenModal = (contributor) => {
    setSelectedContributor(contributor);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedContributor(null);
    setShowModal(false);
  };

  const handleOpenGitHubProfile = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenRepo = () => {
    window.open(PROJECT_ADMIN.repoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="contributors-page">
      {/* Header Section */}
      <section className="contributors-header">
        <h1 className="contributors-title">Our Amazing Contributors</h1>
        <p className="contributors-subtitle">
          Meet the talented developers who help make CryptoHub better every day.
        </p>

        <div className="contributors-stats">
          <div className="contributors-stat-card">
            <span className="stat-label">Contributors</span>
            <span className="stat-value">{contributors.length}</span>
          </div>

          <div className="contributors-stat-card">
            <span className="stat-label">Total PRs</span>
            <span className="stat-value">
              {contributors.reduce((sum, c) => sum + c.totalPRs, 0)}
            </span>
          </div>

          <div className="contributors-stat-card">
            <span className="stat-label">Total Points</span>
            <span className="stat-value">
              {contributors.reduce((sum, c) => sum + c.totalPoints, 0)}
            </span>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="contributors-controls">
        <input
          type="text"
          className="contributors-search-input"
          placeholder="Search contributor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="contributors-filters">
          <select
            className="contributors-select contributors-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="most_points">Most Contributions (Points)</option>
            <option value="most_prs">Most PRs</option>
          </select>

          <select
            className="contributors-select contributors-rank-select"
            value={selectedRankFilter}
            onChange={(e) => setSelectedRankFilter(e.target.value)}
          >
            <option value="all">All Contributors</option>
            <option value="gold">Gold Only</option>
            <option value="silver">Silver Only</option>
            <option value="bronze">Bronze Only</option>
            <option value="contributor">Contributors</option>
          </select>
        </div>
      </section>

      {/*  NEW PROJECT ADMIN SECTION  */}
      <section className="project-admin-section">
        <div className="project-admin-container">
          <div className="project-admin-header">
            <div className="project-admin-avatar-wrapper">
              <img
                src={PROJECT_ADMIN.avatarUrl}
                alt={PROJECT_ADMIN.username}
                className="project-admin-avatar"
              />
              <div className="admin-badge">👑</div>
            </div>
            <div className="project-admin-info">
              <h2 className="project-admin-title">Project Admin</h2>
              <p className="project-admin-username">{PROJECT_ADMIN.username}</p>
              <p className="project-admin-description">{PROJECT_ADMIN.description}</p>
            </div>
          </div>

          <div className="project-admin-repo">
            <h3 className="project-admin-repo-title">Repository</h3>
            <div className="project-admin-repo-link" onClick={handleOpenRepo}>
              <span className="repo-name">{PROJECT_ADMIN.repo}</span>
              <span className="repo-icon">📂</span>
            </div>
          </div>

          <div className="project-admin-actions">
            <button 
              className="btn btn-primary project-admin-btn"
              onClick={() => handleOpenGitHubProfile(PROJECT_ADMIN.githubUrl)}
            >
              View GitHub Profile →
            </button>
            <button 
              className="btn btn-outline project-admin-btn"
              onClick={handleOpenRepo}
            >
              Open Repository 📚
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="contributors-content">
        {loading && (
          <div className="loading-container">
            <p className="contributors-loading">Loading contributor data from GitHub...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p className="contributors-error">{error}</p>
            <p style={{fontSize: '0.85rem', color: '#9ca3af'}}>
              Stats will show "No contributors found" - normal if repo has no merged PRs yet.
            </p>
          </div>
        )}

        {!loading && !error && filteredContributors.length === 0 && (
          <div className="empty-state">
            <p className="contributors-empty">No contributors found.</p>
            <p style={{fontSize: '0.9rem', color: '#9ca3af'}}>
              No merged pull requests in KaranUnique/CryptoHub yet. 
              <br/>Stats show 0 contributors, 0 PRs, 0 points ✅
            </p>
          </div>
        )}

        {!loading && !error && filteredContributors.length > 0 && (
          <div className="contributors-grid">
            {filteredContributors.map((c) => (
              <article
                key={c.username}
                className={`contributor-card contributor-rank-${c.rank.toLowerCase().replace(' ', '-').replace('🥇', '').replace('🥈', '').replace('🥉', '')}`}
              >
                <div className="contributor-header">
                  <div className="contributor-avatar-wrapper">
                    <img
                      src={c.avatar_url}
                      alt={c.username}
                      className="contributor-avatar"
                    />
                  </div>
                  <div className="contributor-basic-info">
                    <h2 className="contributor-username">{c.username}</h2>
                    <p className={`contributor-rank contributor-rank-${c.rank.toLowerCase().replace(' ', '-').replace('🥇', '').replace('🥈', '').replace('🥉', '')}`}>
                      {c.rank}
                    </p>
                  </div>
                </div>

                <div className="contributor-stats">
                  <div className="contributor-stat-item">
                    <span className="contributor-stat-label">Points</span>
                    <span className="contributor-stat-value">{c.totalPoints}</span>
                  </div>
                  <div className="contributor-stat-item">
                    <span className="contributor-stat-label">Merged PRs</span>
                    <span className="contributor-stat-value">{c.totalPRs}</span>
                  </div>
                </div>

                <div className="contributor-actions">
                  <button
                    className="btn btn-primary btn-view-prs"
                    onClick={() => handleOpenModal(c)}
                  >
                    View PR details
                  </button>
                  <button
                    className="btn btn-outline btn-view-github"
                    onClick={() => handleOpenGitHubProfile(c.html_url)}
                  >
                    GitHub Profile →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal for PR details */}
      {showModal && selectedContributor && (
        <div className="contributors-modal-backdrop" onClick={handleCloseModal}>
          <div
            className="contributors-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="contributors-modal-header">
              <h2 className="contributors-modal-title">
                PRs by {selectedContributor.username}
              </h2>
              <button
                className="contributors-modal-close"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <div className="contributors-modal-body">
              {selectedContributor.prs.length === 0 && (
                <p className="contributors-modal-empty">
                  No merged pull requests found for this contributor.
                </p>
              )}

              {selectedContributor.prs.length > 0 && (
                <ul className="contributors-modal-pr-list">
                  {selectedContributor.prs.map((pr) => (
                    <li key={pr.id} className="contributors-modal-pr-item">
                      <div className="contributors-modal-pr-main">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contributors-modal-pr-title"
                        >
                          #{pr.number} — {pr.title}
                        </a>
                        <span className="contributors-modal-pr-date">
                          Merged at: {pr.merged_at
                            ? new Date(pr.merged_at).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>

                      <div className="contributors-modal-pr-meta">
                        <span className="contributors-modal-pr-level">
                          Level: {pr.level ? `Level ${pr.level}` : "Not specified"}
                        </span>
                        <span className="contributors-modal-pr-points">
                          Points: {pr.points}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="contributors-modal-footer">
              <button
                className="btn btn-secondary contributors-modal-close-btn"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contributors;
