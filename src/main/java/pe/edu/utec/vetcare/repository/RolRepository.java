package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utec.vetcare.entity.RolEntity;

import java.util.Optional;

public interface RolRepository
        extends JpaRepository<RolEntity, Long> {

    Optional<RolEntity> findByNombre(String nombre);
}