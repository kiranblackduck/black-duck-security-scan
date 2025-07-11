package black_duck_security_scan

import (
	"crypto/tls"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"
)

func main() {
	target1, _ := url.Parse("https://integrations-qa.dev.cnc.duckutil.net")
	target2, _ := url.Parse("https://artifactory.tools.duckutil.net")
	target3, _ := url.Parse("https://repo.blackduck.com/")

	// Create proxies for both targets with custom transport
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // Skip verification for upstream servers
		},
		MaxIdleConns:       100,
		IdleConnTimeout:    90 * time.Second,
		DisableCompression: false,
	}

	proxy1 := httputil.NewSingleHostReverseProxy(target1)
	proxy1.Transport = transport

	proxy2 := httputil.NewSingleHostReverseProxy(target2)
	proxy2.Transport = transport

	proxy3 := httputil.NewSingleHostReverseProxy(target3)
	proxy3.Transport = transport

	// Custom error handler for proxy failures
	errorHandler := func(w http.ResponseWriter, req *http.Request, err error) {
		log.Printf("Proxy error for %s %s: %v", req.Method, req.URL.Path, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte(`{"error": "upstream server unavailable", "message": "This is expected in testing environment"}`))
	}

	// Set error handlers for proxies
	proxy1.ErrorHandler = errorHandler
	proxy2.ErrorHandler = errorHandler
	proxy3.ErrorHandler = errorHandler

	// Route requests based on the Host header or path
	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		log.Printf("Received request: %s %s from %s", req.Method, req.URL.Path, req.RemoteAddr)

		// Add CORS headers for testing
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if req.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// For testing: respond to health check endpoints directly
		if req.URL.Path == "/health" || req.URL.Path == "/" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status": "ok", "message": "SSL proxy is running"}`))
			return
		}

		// Route to artifactory if path contains /artifactory/
		if strings.Contains(req.URL.Path, "/artifactory/") {
			log.Printf("Proxying to internal artifactory: %s", req.URL.Path)

			// Create a copy of the request to avoid modifying the original
			proxyReq := req.Clone(req.Context())
			proxyReq.URL.Host = target2.Host
			proxyReq.URL.Scheme = target2.Scheme
			proxyReq.Header.Set("Host", target2.Host)
			proxyReq.RequestURI = "" // Must clear this for proxy

			proxy2.ServeHTTP(w, proxyReq)
		} else if strings.Contains(req.URL.Path, "blackduck/integration") {
			log.Printf("Proxying to public artifactory: %s", req.URL.Path)

			// Create a copy of the request to avoid modifying the original
			proxyReq := req.Clone(req.Context())
			proxyReq.URL.Host = target3.Host
			proxyReq.URL.Scheme = target3.Scheme
			proxyReq.Header.Set("Host", target3.Host)
			proxyReq.RequestURI = "" // Must clear this for proxy

			proxy3.ServeHTTP(w, proxyReq)
		} else {
			log.Printf("Proxying to product: %s", req.URL.Path)

			// Create a copy of the request to avoid modifying the original
			proxyReq := req.Clone(req.Context())
			proxyReq.URL.Host = target1.Host
			proxyReq.URL.Scheme = target1.Scheme
			proxyReq.Header.Set("Host", target1.Host)
			proxyReq.RequestURI = "" // Must clear this for proxy

			proxy1.ServeHTTP(w, proxyReq)
		}
	})

	// Configure TLS with proper options
	tlsConfig := &tls.Config{
		MinVersion:               tls.VersionTLS12,
		CurvePreferences:         []tls.CurveID{tls.CurveP521, tls.CurveP384, tls.CurveP256},
		PreferServerCipherSuites: true,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_RSA_WITH_AES_128_GCM_SHA256,
		},
	}

	// Configure HTTPS server
	httpsServer := &http.Server{
		Addr:         "localhost:8443",
		ReadTimeout:  30 * time.Second,  // Increased for larger downloads
		WriteTimeout: 60 * time.Second,  // Increased for larger downloads
		IdleTimeout:  120 * time.Second, // Increased for keep-alive
		TLSConfig:    tlsConfig,
		Handler:      nil, // Use default ServeMux
	}

	log.Println("Starting HTTPS server on localhost:8443...")
	// Based on verification: auto_key.pem contains certificate, auto_cert.pem contains private key
	// ListenAndServeTLS(certFile, keyFile) - use the certificate file first, then key file
	if err := httpsServer.ListenAndServeTLS("/Users/lokesha/IdeaProjects/Claude/black-duck-security-scan/cert.pem", "/Users/lokesha/IdeaProjects/Claude/black-duck-security-scan/key.pem"); err != nil {
		log.Fatalf("HTTPS Server failed: %v", err)
	}
}
