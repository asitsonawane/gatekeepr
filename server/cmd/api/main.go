package main

import (
	"log"
	"net/http"
	"os"

	"gatekeepr/internal/auth"
	"gatekeepr/internal/database"
	"gatekeepr/internal/handlers"
	authMiddleware "gatekeepr/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./gatekeepr.db"
	}

	if err := database.InitDB(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Println("Database initialized successfully!")

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS middleware with credentials support
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			// Allow localhost origins for development
			if origin == "http://localhost:3000" || origin == "http://localhost:5173" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Public routes
	r.Post("/login", handlers.Login)
	r.Post("/logout", handlers.Logout)
	r.Get("/check-setup", handlers.CheckSetup)
	r.Post("/setup", handlers.Setup)

	// Authenticated routes
	r.Group(func(r chi.Router) {
		r.Use(authMiddleware.Auth)

		// User profile
		r.Get("/me", func(w http.ResponseWriter, r *http.Request) {
			claims := r.Context().Value(authMiddleware.UserContextKey).(*auth.Claims)
			w.Write([]byte("Hello, " + claims.Email))
		})

		// Access requests (any authenticated user)
		r.Route("/api/access", func(r chi.Router) {
			r.Post("/request", handlers.CreateAccessRequest)
			r.Get("/my-requests", handlers.GetMyRequests)
			r.Get("/requests", handlers.ListAccessRequests)
			r.Get("/requests/pending", handlers.GetPendingRequests)
			r.Post("/requests/{id}/approve", handlers.ApproveAccessRequest)
			r.Post("/requests/{id}/reject", handlers.RejectAccessRequest)
			r.Post("/grant", handlers.DirectGrant)
			r.Post("/revoke", handlers.RevokeAccess)
		})

		// Roles management
		r.Route("/api/roles", func(r chi.Router) {
			r.Get("/", handlers.ListRoles)
			r.Get("/hierarchy", handlers.GetRoleHierarchy)
			r.Get("/{id}", handlers.GetRole)
			r.Get("/{id}/permissions", handlers.GetRolePermissions)

			// Write operations require permission
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("roles.create"))
				r.Post("/", handlers.CreateRole)
			})
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("roles.update"))
				r.Put("/{id}", handlers.UpdateRole)
				r.Put("/{id}/permissions", handlers.SetRolePermissions)
			})
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("roles.delete"))
				r.Delete("/{id}", handlers.DeleteRole)
			})
		})

		// Permissions management
		r.Route("/api/permissions", func(r chi.Router) {
			r.Get("/", handlers.ListPermissions)
			r.Get("/categories", handlers.GetPermissionCategories)
			r.Get("/{id}", handlers.GetPermission)

			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequireRole("super_admin", "admin"))
				r.Post("/", handlers.CreatePermission)
				r.Put("/{id}", handlers.UpdatePermission)
				r.Delete("/{id}", handlers.DeletePermission)
			})
		})

		// Groups management
		r.Route("/api/groups", func(r chi.Router) {
			r.Get("/", handlers.ListGroups)
			r.Get("/{id}", handlers.GetGroup)
			r.Get("/{id}/members", handlers.GetGroupMembers)

			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("groups.create"))
				r.Post("/", handlers.CreateGroup)
			})
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("groups.update"))
				r.Put("/{id}", handlers.UpdateGroup)
				r.Put("/{id}/permissions", handlers.SetGroupPermissions)
			})
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("groups.manage_members"))
				r.Post("/{id}/members", handlers.AddGroupMembers)
				r.Delete("/{id}/members/{userId}", handlers.RemoveGroupMember)
			})
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("groups.delete"))
				r.Delete("/{id}", handlers.DeleteGroup)
			})
		})

		// Tools management
		r.Route("/api/tools", func(r chi.Router) {
			r.Get("/", handlers.ListTools)
			r.Get("/categories", handlers.GetToolCategories)
			r.Get("/{id}", handlers.GetTool)

			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("tools.create"))
				r.Post("/", handlers.CreateTool)
			})
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("tools.update"))
				r.Put("/{id}", handlers.UpdateTool)
			})
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("tools.delete"))
				r.Delete("/{id}", handlers.DeleteTool)
			})
		})

		// Bulk operations
		r.Route("/api/bulk", func(r chi.Router) {
			r.Use(authMiddleware.RequireRole("super_admin", "admin"))
			r.Post("/users/roles", handlers.BulkAssignRoles)
			r.Delete("/users/roles", handlers.BulkRemoveRoles)
			r.Post("/users/groups", handlers.BulkAddToGroups)
			r.Post("/groups/permissions", handlers.BulkAssignPermissions)
			r.Post("/access/grant", handlers.BulkGrantAccess)
		})

		// Audit logs
		r.Route("/api/audit", func(r chi.Router) {
			r.Use(authMiddleware.RequirePermission("audit.read"))
			r.Get("/logs", handlers.ListAuditLogs)
			r.Get("/categories", handlers.GetAuditLogCategories)

			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.RequirePermission("audit.export"))
				r.Get("/export", handlers.ExportAuditLogs)
			})
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
