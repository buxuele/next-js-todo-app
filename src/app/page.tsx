export default function Home() {
  return (
    <div>
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Todo 文件</h3>
          <button className="collapse-btn">
            <span>◀</span>
          </button>
        </div>
        <ul className="date-list">
          <li className="date-item active">
            <span className="date-name">1月26日</span>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">1月26日 Todo</h1>
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-outline-secondary">导出</button>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="搜索任务..."
                  style={{
                    width: "300px",
                    padding: "6px 8px",
                    fontSize: "1.15rem",
                    fontWeight: "normal",
                    lineHeight: "1.4",
                  }}
                />
                <button className="btn btn-outline-primary">搜索</button>
              </div>
            </div>
          </div>

          <form className="d-flex gap-3 mb-3">
            <textarea
              className="form-control"
              placeholder="添加新任务 (Shift+Enter换行，Enter提交)"
              rows={2}
              style={{
                resize: "vertical",
                minHeight: "76px",
                fontSize: "1.2rem",
                padding: "16px 20px",
                flex: 1,
              }}
            />
            <button
              className="btn btn-primary"
              type="submit"
              style={{
                minWidth: "120px",
                fontSize: "1.3rem",
                fontWeight: "bold",
                padding: 0,
                height: "76px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              添加
            </button>
          </form>

          <ul className="list-group">
            <li className="list-group-item">
              <span className="todo-content">示例任务 - 设置项目基础结构</span>
              <span className="todo-dates">创建: 09:30</span>
              <div className="todo-actions">
                <button className="btn btn-outline-secondary">复制</button>
                <button className="btn btn-outline-secondary">修改</button>
                <button className="btn btn-outline-danger">删除</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
