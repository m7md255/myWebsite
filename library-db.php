<?php
// ============================================
// Library Database Configuration
// ============================================

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'personal_library');

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'فشل الاتصال بقاعدة البيانات: ' . $conn->connect_error]));
}

// Create database if not exists
$sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME;
if (!$conn->query($sql)) {
    die(json_encode(['success' => false, 'message' => 'خطأ في إنشاء قاعدة البيانات: ' . $conn->error]));
}

// Select database
$conn->select_db(DB_NAME);

// Create tables if not exists
$tables = [
    // Books table
    "CREATE TABLE IF NOT EXISTS books (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(20),
        publisher VARCHAR(255),
        publish_year INT,
        total_pages INT,
        current_page INT DEFAULT 0,
        language VARCHAR(50) DEFAULT 'العربية',
        location VARCHAR(255),
        status ENUM('لم أبدأ', 'قيد القراءة', 'منتهي', 'متوقف') DEFAULT 'لم أبدأ',
        rating INT DEFAULT 0,
        start_date DATE,
        end_date DATE,
        notes TEXT,
        favorite TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    // Categories table
    "CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#007aff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    
    // Book-Categories junction table (many-to-many)
    "CREATE TABLE IF NOT EXISTS book_categories (
        book_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (book_id, category_id),
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )"
];

// Execute table creation
foreach ($tables as $table_sql) {
    if (!$conn->query($table_sql)) {
        die(json_encode(['success' => false, 'message' => 'خطأ في إنشاء الجداول: ' . $conn->error]));
    }
}

// Helper function to get all books with categories
function getBooks($conn, $filters = []) {
    $query = "SELECT b.*, 
                     GROUP_CONCAT(c.id) as category_ids,
                     GROUP_CONCAT(c.name) as category_names,
                     GROUP_CONCAT(c.color) as category_colors
              FROM books b
              LEFT JOIN book_categories bc ON b.id = bc.book_id
              LEFT JOIN categories c ON bc.category_id = c.id";
    
    $conditions = [];
    
    if (!empty($filters['status'])) {
        $status = $conn->real_escape_string($filters['status']);
        $conditions[] = "b.status = '$status'";
    }
    
    if (!empty($filters['search'])) {
        $search = $conn->real_escape_string($filters['search']);
        $conditions[] = "(b.title LIKE '%$search%' OR b.author LIKE '%$search%')";
    }
    
    if (!empty($filters['category_id'])) {
        $category_id = intval($filters['category_id']);
        $conditions[] = "c.id = $category_id";
    }
    
    if (!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $query .= " GROUP BY b.id ORDER BY b.created_at DESC";
    
    $result = $conn->query($query);
    
    if (!$result) {
        return false;
    }
    
    $books = [];
    while ($row = $result->fetch_assoc()) {
        // Parse categories
        $categories = [];
        if (!empty($row['category_ids'])) {
            $ids = explode(',', $row['category_ids']);
            $names = explode(',', $row['category_names']);
            $colors = explode(',', $row['category_colors']);
            
            for ($i = 0; $i < count($ids); $i++) {
                $categories[] = [
                    'id' => $ids[$i],
                    'name' => $names[$i],
                    'color' => $colors[$i]
                ];
            }
        }
        
        $row['categories'] = $categories;
        unset($row['category_ids']);
        unset($row['category_names']);
        unset($row['category_colors']);
        
        $books[] = $row;
    }
    
    return $books;
}

// Helper function to get statistics
function getStatistics($conn) {
    $stats = [];
    
    // Total books
    $result = $conn->query("SELECT COUNT(*) as count FROM books");
    $stats['total_books'] = $result->fetch_assoc()['count'];
    
    // Books by status
    $statuses = ['لم أبدأ', 'قيد القراءة', 'منتهي', 'متوقف'];
    $stats['by_status'] = [];
    
    foreach ($statuses as $status) {
        $status_escaped = $conn->real_escape_string($status);
        $result = $conn->query("SELECT COUNT(*) as count FROM books WHERE status = '$status_escaped'");
        $stats['by_status'][$status] = $result->fetch_assoc()['count'];
    }
    
    // Total pages
    $result = $conn->query("SELECT SUM(total_pages) as total FROM books WHERE total_pages > 0");
    $row = $result->fetch_assoc();
    $stats['total_pages'] = $row['total'] ?? 0;
    
    // Pages read
    $result = $conn->query("SELECT SUM(current_page) as total FROM books WHERE current_page > 0");
    $row = $result->fetch_assoc();
    $stats['pages_read'] = $row['total'] ?? 0;
    
    // Favorite books
    $result = $conn->query("SELECT COUNT(*) as count FROM books WHERE favorite = 1");
    $stats['favorite_count'] = $result->fetch_assoc()['count'];
    
    return $stats;
}

// Set charset
$conn->set_charset("utf8mb4");

// Return connection
// (This file is included, not executed directly)
?>
