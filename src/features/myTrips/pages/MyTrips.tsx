// src/features/myTrips/pages/MyTrips.tsx

import React from "react";
import "../styles/MyTrips.css";
import { useMyTrips } from "./../hooks/useMyTrips";
import { TripCard } from "./../components/TripCard";
import { TripCreateModal } from "./../components/TripCreateModal";
import type { TripFilter } from "./../hooks/useMyTrips";

export default function MyTrips() {
  const {
    filter,
    setFilter,
    isModalOpen,
    setIsModalOpen,
    trips,
    isLoading,
    error,
    currentUser,
    formData,
    setFormData,
    resetForm,
    removeTrip,
    getTripStatus,
    handleSubmit,
    isSubmitting,
  } = useMyTrips();

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  return (
    <section className="page-section">
      <button className="fab-btn" onClick={openModal}>
        <i className="fa-solid fa-plus"></i>
        <span className="fab-text">NEW PLAN</span>
      </button>

      <TripCreateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        currentUser={currentUser}
      />

      <div className="container" id="trip-list-ui">
        <div className="section-header-neob">
          <div className="header-content">
            <h2 className="sec-title">MY PLAN BOARD</h2>
            <p className="sec-desc">수립된 여행 작전 목록입니다.</p>
          </div>

          <div className="filter-wrapper-neob">
            <div className="filter-tabs">
              {(["all", "public", "private"] as TripFilter[]).map((type) => (
                <button
                  key={type}
                  className={`filter-btn ${filter === type ? "active" : ""}`}
                  onClick={() => setFilter(type)}
                >
                  {type === "all" ? "ALL SECTORS" : type.toUpperCase()}
                </button>
              ))}
              <button
                className={`filter-btn ${filter === "invited" ? "active" : ""}`}
                onClick={() => setFilter("invited")}
              >
                초대된 여행
              </button>
            </div>
          </div>
        </div>

        <div className="trip-grid">
          {isLoading && (
            <p className="empty-text">여행 목록을 불러오는 중입니다.</p>
          )}
          {!isLoading && error && <p className="empty-text">{error}</p>}
          {!isLoading && !error && trips.length === 0 && (
            <p className="empty-text">표시할 여행이 없습니다.</p>
          )}
          {!isLoading &&
            !error &&
            trips.map((trip) => (
              <TripCard
                key={trip.tripId}
                trip={trip}
                status={getTripStatus(trip.tripStartDate, trip.tripEndDate)}
                onDelete={removeTrip}
                isInvited={filter === "invited"}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
