package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Report;
import mil.dds.anet.database.mappers.CommentMapper;
import mil.dds.anet.utils.DaoUtils;

public class CommentDao implements IAnetDao<Comment> {

	Handle dbHandle;
	
	public CommentDao(Handle dbHandle) { 
		this.dbHandle = dbHandle;
	}
	
	@Override
	public List<Comment> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	//Comments are ALWAYS loaded with the author, since they are never displayed without their author
	@Override
	public Comment getById(int id) {
		List<Comment> results = dbHandle.createQuery("SELECT comments.id AS c_id, "
				+ "comments.createdAt AS c_createdAt, c.updatedAt AS c_updatedAt, "
				+ "c.authorId, c.reportId, c.text, people.* "
				+ "FROM comments LEFT JOIN people ON comments.authorId = person.id "
				+ "WHERE comments.id = :id")
			.bind("id", id)
			.map(new CommentMapper())
			.list();
		if (results.size() == 0) { return null; } 
		return results.get(0);
	}

	@Override
	public Comment insert(Comment c) {
		c.setCreatedAt(DateTime.now());
		c.setUpdatedAt(DateTime.now());
		GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement("INSERT INTO comments (id, reportId, authorId, createdAt, updatedAt, text)" + 
				"VALUES (:id, :reportId, :authorId, :createdAt, :updatedAt, :text)")
			.bindFromProperties(c)
			.bind("authorId", DaoUtils.getId(c.getAuthor()))
			.executeAndReturnGeneratedKeys();
		c.setId((Integer)keys.first().get("last_insert_rowid()"));
		return c;
	}

	@Override
	public int update(Comment c) {
		c.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("UPDATE comments SET text = :text, updatedAt = :updatedAt WHERE id = :id")
			.bindFromProperties(c)
			.execute();
	}

	public List<Comment> getCommentsForReport(Report report) {
		return dbHandle.createQuery("SELECT c.id AS c_id, "
				+ "c.createdAt AS c_createdAt, c.updatedAt AS c_updatedAt, "
				+ "c.authorId, c.reportId, c.text, people.* "
				+ "FROM comments c LEFT JOIN people ON c.authorId = people.id "
				+ "WHERE c.reportId = :reportId ORDER BY c.createdAt ASC")
			.bind("reportId", report.getId())
			.map(new CommentMapper())
			.list();
	}

	public int delete(int commentId) {
		return dbHandle.createStatement("DELETE FROM comments where id = :id")
			.bind("id", commentId)
			.execute();
		
	}

}
