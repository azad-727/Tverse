package com.thalasi.tverse.repository;
import com.thalasi.tverse.model.category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface categoryRepo extends JpaRepository<category,Long> {
Optional<category>findByName(String name);

}
