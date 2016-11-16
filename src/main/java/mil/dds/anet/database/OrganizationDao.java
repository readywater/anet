package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.database.mappers.OrganizationMapper;

public class OrganizationDao implements IAnetDao<Organization> {

	Handle dbHandle;
	GroupDao groupDao;
	
	public OrganizationDao(Handle dbHandle, GroupDao groupDao) { 
		this.dbHandle = dbHandle;
		this.groupDao = groupDao;
	}
	
	public List<Organization> getAll(int pageNum, int pageSize) {
		Query<Organization> query = dbHandle.createQuery("SELECT * from organizations ORDER BY createdAt ASC LIMIT :limit OFFSET :offset")
			.bind("limit", pageSize)
			.bind("offset", pageSize * pageNum)
			.map(new OrganizationMapper());
		return query.list();
	}
	
	public Organization getById(int id) { 
		Query<Organization> query = dbHandle.createQuery(
				"Select * from organizations where id = :id")
			.bind("id",id)
			.map(new OrganizationMapper());
		List<Organization> results = query.list();
		return (results.size() == 0) ? null : results.get(0);
	}
	
	public Organization insert(Organization ao) {
		ao.setCreatedAt(DateTime.now());
		ao.setUpdatedAt(ao.getCreatedAt());
		
		GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
				"INSERT INTO organizations (name, createdAt, updatedAt) " + 
				"VALUES (:name, :createdAt, :updatedAt)")
			.bind("name", ao.getName())
			.bind("createdAt", ao.getCreatedAt())
			.bind("updatedAt", ao.getUpdatedAt())
			.executeAndReturnGeneratedKeys();
		
		ao.setId(((Integer)keys.first().get("last_insert_rowid()")).intValue());
		return ao;
	}
	
	public int update(Organization ao) {
		ao.setUpdatedAt(DateTime.now());
		int numRows = dbHandle.createStatement("UPDATE organizations SET name = :name, updatedAt = :updatedAt where id = :id")
				.bind("name", ao.getName())
				.bind("updatedAt", ao.getUpdatedAt())
				.bind("id", ao.getId())
				.execute();
			
		return numRows;
	}
	
	public void deleteAdvisorOrganization(Organization ao) { 
		dbHandle.createStatement("DELETE from advisorOrganizations where id = :id")
			.bind("id", ao.getId())
			.execute();
	} 
}