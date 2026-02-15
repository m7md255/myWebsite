<?php
// ============================================
// Library API - All CRUD Operations
// ============================================

header('Content-Type: application/json; charset=utf-8');

// Include database configuration
require_once 'library-db.php';

// Get action from request
$action = $_POST['action'] ?? '';

// Sanitize and process action
switch ($action) {
    // ========== BOOKS OPERATIONS ==========
    
    case 'get_books':
        $filters = [
            'status' => $_POST['status'] ?? '',
            'search' => $_POST['search'] ?? '',
            'category_id' => $_POST['category_id'] ?? ''
        ];
        $books = getBooks($conn, $filters);
        echo json_encode(['success' => true, 'data' => $books]);
        break;
    
    case 'get_book':
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'معرف الكتاب غير صحيح']);
            break;
        }
        
        $result = $conn->query("SELECT * FROM books WHERE id = $id");
        
        if ($result && $result->num_rows > 0) {
            $book = $result->fetch_assoc();
            
            // Get categories
            $cat_result = $conn->query("
                SELECT c.id, c.name, c.color FROM categories c
                JOIN book_categories bc ON c.id = bc.category_id
                WHERE bc.book_id = $id
            ");
            
            $categories = [];
            while ($cat = $cat_result->fetch_assoc()) {
                $categories[] = $cat;
            }
            
            $book['categories'] = $categories;
            
            echo json_encode(['success' => true, 'data' => $book]);
        } else {
            echo json_encode(['success' => false, 'message' => 'الكتاب غير موجود']);
        }
        break;
    
    case 'add_book':
        $title = $conn->real_escape_string($_POST['title'] ?? '');
        $author = $conn->real_escape_string($_POST['author'] ?? '');
        $isbn = $conn->real_escape_string($_POST['isbn'] ?? '');
        $publisher = $conn->real_escape_string($_POST['publisher'] ?? '');
        $publish_year = intval($_POST['publish_year'] ?? 0);
        $total_pages = intval($_POST['total_pages'] ?? 0);
        $current_page = intval($_POST['current_page'] ?? 0);
        $language = $conn->real_escape_string($_POST['language'] ?? 'العربية');
        $location = $conn->real_escape_string($_POST['location'] ?? '');
        $status = $conn->real_escape_string($_POST['status'] ?? 'لم أبدأ');
        $rating = intval($_POST['rating'] ?? 0);
        $start_date = !empty($_POST['start_date']) ? $conn->real_escape_string($_POST['start_date']) : NULL;
        $end_date = !empty($_POST['end_date']) ? $conn->real_escape_string($_POST['end_date']) : NULL;
        $notes = $conn->real_escape_string($_POST['notes'] ?? '');
        $favorite = intval($_POST['favorite'] ?? 0);
        
        // Validate required fields
        if (empty($title) || empty($author)) {
            echo json_encode(['success' => false, 'message' => 'العنوان والمؤلف مطلوبان']);
            break;
        }
        
        // Insert book
        $start_date_sql = $start_date ? "'$start_date'" : 'NULL';
        $end_date_sql = $end_date ? "'$end_date'" : 'NULL';
        
        $sql = "INSERT INTO books (title, author, isbn, publisher, publish_year, total_pages, 
                current_page, language, location, status, rating, start_date, end_date, notes, favorite)
                VALUES ('$title', '$author', '$isbn', '$publisher', $publish_year, $total_pages, 
                $current_page, '$language', '$location', '$status', $rating, $start_date_sql, 
                $end_date_sql, '$notes', $favorite)";
        
        if (!$conn->query($sql)) {
            echo json_encode(['success' => false, 'message' => 'خطأ في إضافة الكتاب: ' . $conn->error]);
            break;
        }
        
        $book_id = $conn->insert_id;
        
        // Link categories
        $categories = $_POST['categories'] ?? [];
        foreach ($categories as $category_id) {
            $cat_id = intval($category_id);
            $conn->query("INSERT INTO book_categories (book_id, category_id) VALUES ($book_id, $cat_id)");
        }
        
        echo json_encode(['success' => true, 'message' => 'تم إضافة الكتاب بنجاح', 'data' => ['id' => $book_id]]);
        break;
    
    case 'update_book':
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'معرف الكتاب غير صحيح']);
            break;
        }
        
        $title = $conn->real_escape_string($_POST['title'] ?? '');
        $author = $conn->real_escape_string($_POST['author'] ?? '');
        $isbn = $conn->real_escape_string($_POST['isbn'] ?? '');
        $publisher = $conn->real_escape_string($_POST['publisher'] ?? '');
        $publish_year = intval($_POST['publish_year'] ?? 0);
        $total_pages = intval($_POST['total_pages'] ?? 0);
        $current_page = intval($_POST['current_page'] ?? 0);
        $language = $conn->real_escape_string($_POST['language'] ?? 'العربية');
        $location = $conn->real_escape_string($_POST['location'] ?? '');
        $status = $conn->real_escape_string($_POST['status'] ?? 'لم أبدأ');
        $rating = intval($_POST['rating'] ?? 0);
        $start_date = !empty($_POST['start_date']) ? $conn->real_escape_string($_POST['start_date']) : NULL;
        $end_date = !empty($_POST['end_date']) ? $conn->real_escape_string($_POST['end_date']) : NULL;
        $notes = $conn->real_escape_string($_POST['notes'] ?? '');
        $favorite = intval($_POST['favorite'] ?? 0);
        
        if (empty($title) || empty($author)) {
            echo json_encode(['success' => false, 'message' => 'العنوان والمؤلف مطلوبان']);
            break;
        }
        
        $start_date_sql = $start_date ? "'$start_date'" : 'NULL';
        $end_date_sql = $end_date ? "'$end_date'" : 'NULL';
        
        $sql = "UPDATE books SET 
                title = '$title',
                author = '$author',
                isbn = '$isbn',
                publisher = '$publisher',
                publish_year = $publish_year,
                total_pages = $total_pages,
                current_page = $current_page,
                language = '$language',
                location = '$location',
                status = '$status',
                rating = $rating,
                start_date = $start_date_sql,
                end_date = $end_date_sql,
                notes = '$notes',
                favorite = $favorite
                WHERE id = $id";
        
        if (!$conn->query($sql)) {
            echo json_encode(['success' => false, 'message' => 'خطأ في تحديث الكتاب: ' . $conn->error]);
            break;
        }
        
        // Update categories
        $conn->query("DELETE FROM book_categories WHERE book_id = $id");
        
        $categories = $_POST['categories'] ?? [];
        foreach ($categories as $category_id) {
            $cat_id = intval($category_id);
            $conn->query("INSERT INTO book_categories (book_id, category_id) VALUES ($id, $cat_id)");
        }
        
        echo json_encode(['success' => true, 'message' => 'تم تحديث الكتاب بنجاح']);
        break;
    
    case 'delete_book':
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'معرف الكتاب غير صحيح']);
            break;
        }
        
        $sql = "DELETE FROM books WHERE id = $id";
        
        if (!$conn->query($sql)) {
            echo json_encode(['success' => false, 'message' => 'خطأ في حذف الكتاب: ' . $conn->error]);
            break;
        }
        
        echo json_encode(['success' => true, 'message' => 'تم حذف الكتاب بنجاح']);
        break;
    
    // ========== CATEGORIES OPERATIONS ==========
    
    case 'get_categories':
        $result = $conn->query("SELECT * FROM categories ORDER BY name");
        
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $categories]);
        break;
    
    case 'add_category':
        $name = $conn->real_escape_string($_POST['name'] ?? '');
        $color = $conn->real_escape_string($_POST['color'] ?? '#007aff');
        
        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => 'اسم التصنيف مطلوب']);
            break;
        }
        
        $sql = "INSERT INTO categories (name, color) VALUES ('$name', '$color')";
        
        if (!$conn->query($sql)) {
            if (strpos($conn->error, 'Duplicate entry') !== false) {
                echo json_encode(['success' => false, 'message' => 'هذا التصنيف موجود بالفعل']);
            } else {
                echo json_encode(['success' => false, 'message' => 'خطأ في إضافة التصنيف: ' . $conn->error]);
            }
            break;
        }
        
        echo json_encode(['success' => true, 'message' => 'تم إضافة التصنيف بنجاح', 'data' => ['id' => $conn->insert_id]]);
        break;
    
    case 'update_category':
        $id = intval($_POST['id'] ?? 0);
        $name = $conn->real_escape_string($_POST['name'] ?? '');
        $color = $conn->real_escape_string($_POST['color'] ?? '#007aff');
        
        if ($id <= 0 || empty($name)) {
            echo json_encode(['success' => false, 'message' => 'بيانات غير صحيحة']);
            break;
        }
        
        $sql = "UPDATE categories SET name = '$name', color = '$color' WHERE id = $id";
        
        if (!$conn->query($sql)) {
            echo json_encode(['success' => false, 'message' => 'خطأ في تحديث التصنيف: ' . $conn->error]);
            break;
        }
        
        echo json_encode(['success' => true, 'message' => 'تم تحديث التصنيف بنجاح']);
        break;
    
    case 'delete_category':
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'معرف التصنيف غير صحيح']);
            break;
        }
        
        $sql = "DELETE FROM categories WHERE id = $id";
        
        if (!$conn->query($sql)) {
            echo json_encode(['success' => false, 'message' => 'خطأ في حذف التصنيف: ' . $conn->error]);
            break;
        }
        
        echo json_encode(['success' => true, 'message' => 'تم حذف التصنيف بنجاح']);
        break;
    
    // ========== STATISTICS OPERATIONS ==========
    
    case 'get_statistics':
        $stats = getStatistics($conn);
        echo json_encode(['success' => true, 'data' => $stats]);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'إجراء غير معروف']);
        break;
}

$conn->close();
?>
