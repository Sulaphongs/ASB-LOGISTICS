<?php
/**
 * ການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ MySQL (PDO)
 * ອ່ານຄ່າຈາກ .env — ບໍ່ເກັບລະຫັດຜ່ານໄວ້ໃນໂຄ້ດແບບ hardcode ອີກຕໍ່ໄປ
 * (ptpos.shop/config/database.php ເກັບ user/password ໄວ້ກົງໆໃນໄຟລ໌ —
 * ຫ້າມເຮັດແບບນັ້ນຕໍ່, ໂດຍສະເພາະຖ້າຈະເອົາໂຄ້ດຂຶ້ນ git/ແບ່ງປັນ)
 */
require_once __DIR__ . '/env.php';

class Database
{
    private string $host;
    private string $database_name;
    private string $username;
    private string $password;
    private string $charset;
    public ?PDO $conn = null;

    public function __construct()
    {
        $this->host          = env('DB_HOST', 'localhost');
        $this->database_name = env('DB_NAME', 'asb_logistics');
        $this->username       = env('DB_USER', 'root');
        $this->password       = env('DB_PASS', '');
        $this->charset         = env('DB_CHARSET', 'utf8mb4');
    }

    public function getConnection(): PDO
    {
        $this->conn = null;
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->database_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => 30,
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $exception) {
            error_log('DB connection error: ' . $exception->getMessage());
            throw new Exception('ເກີດຄວາມຜິດພາດໃນການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ. ກະລຸນາກວດສອບໄຟລ໌ .env');
        }
        return $this->conn;
    }

    public function closeConnection(): void
    {
        $this->conn = null;
    }
}

/**
 * ຟັງຊັນຊ່ວຍ Query ແບບໄວ (prepared statement)
 */
function executeQuery(string $query, array $params = [])
{
    $database = new Database();
    $conn = $database->getConnection();
    try {
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $verb = strtoupper(substr(ltrim($query), 0, 6));
        if ($verb === 'SELECT') {
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($verb === 'INSERT') {
            return $conn->lastInsertId();
        }
        return $stmt->rowCount();
    } catch (PDOException $e) {
        error_log('Query error: ' . $e->getMessage() . ' | Query: ' . $query);
        throw new Exception('ເກີດຄວາມຜິດພາດໃນການດຳເນີນການຖານຂໍ້ມູນ');
    } finally {
        $database->closeConnection();
    }
}
